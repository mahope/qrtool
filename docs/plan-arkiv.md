## 2026-10-09 — Kalender-QR flyttede dage (ceo/calendar-date)

Commit: "Keep the calendar date the user typed in QR events" på `master`.

`formatDate` gjorde `new Date('2026-06-23T00:00').toISOString()`. En
`datetime-local`-værdi er et **lokalt** ur-tidspunkt, så i dansk tid giver
det `20260622T220000Z` — QR-koden flyttede begivenheden til 22. juni, og
den afhang af hvilken tidszone siden tilfældigvis kørte i (på en server i
UTC blev det `20260623T000000Z`). Samme indtastning, to forskellige koder.

Nu sendes den værdi brugeren tastede, direkte igennem som flydende
(lokal) tid uden `Z`-synts, så datoen altid er den indtastede og QR-koden
er uafhængig af enhedens tidszone. Kalenderprogrammer viser den i
læserens egen zone, hvilket er hvad en dansk begivenhed ønsker.

Verificeret: `test/calendar-timezone.test.js` kører `getQRData()` under
`Europe/Copenhagen`, `UTC`, `America/New_York` og `Asia/Tokyo` og kræver
identisk output. Uden rettelsen falder 5 af 6 tests.
## 2026-10-09 — QR-kodning af æøå (ceo/qr-encoding)

Commit: "Encode Danish characters as UTF-8 in QR payloads" på `master`.

`lib/qrcode.js` (Kazuhiko Arases qrcode-generator) sætter
`qrcode.stringToBytes = qrcode.stringToBytesFuncs['default']`, der laver
`s.charCodeAt(i) & 0xff` — èn byte pr. tegn. `æ` (U+00E6) blev dermed til
det enkelte byte 0xE6 i byte-mode uden nogen ECI-header, der fortæller
hvilket tegnsæt det er.

Konsekvens: alle seks QR-typer på siden bekræftede dansk tekst kan læses
forkert. Scannere der antager UTF-8 (iOS Kamera, Google Lens) viser møjs.
Beviset i gaten: jsQR afkoder byte 0xE6 til en tom streng, fordi
`decodeURIComponent('%e6')` kaster.

Rettelsen er én linje i `app.js`:
`qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']`, sat efter
`t()` og før første `qrcode(...)`-kald. Biblioteket har konverteren
allerede; den var bare aldrig slået til.

Verificeret: `test/qr-roundtrip.test.js` genererer en kode for hver type,
renderer modulet til RGBA med korrekt quiet zone og afkoder med
`lib/jsQR.min.js`. Uden rettelsen fejler 6 af 14 tests; med den grønne.
# Planarkiv — qrtool.dk

Afsluttede opgaver, fund og historik. Kun append. Nyeste øverst.

## 2026-10-09 — Kvalitetsgate (ceo/quality-gate)

Commit: "Add a real test gate that can fail" på `master`.

Dette var missionens første opgave: `npm test` var `echo "No tests configured" && exit 0` og kunne ikke fejle.

Hvad der blev bygget:
- `npm test` = `npm run build` (clean `dist/`, kopiér assets, minify med esbuild) + `node --test`.
- `test/helpers/dom-stub.js` — minimale DOM-/localStorage-stubs så `app.js` kan evalueres i Node uden en browser og uden nye pakker. Kun den flade `app.js` rører ved load-tid.
- `test/helpers/load-app.js` — pakker `app.js` ind i en funktionskrop via `new Function`, så de top-niveau `const`/`let`-erklæringer kan nås gennem en afsluttende assignment. `qrcode` og `jsQR` fra `lib/` injectes som globals. Der ændres ingen linje i `app.js` for at gøre den testbar.
- `test/qr-strings.test.js` — korrekte WiFi-, vCard-, e-mail-, SMS- og kalenderstrenge: escaping af `;`, `,`, `"`, `\`, æøå, tomme felter, null-returnering uden påkrævede felter.
- `test/site.test.js` — sitemap-fornuft (alle URL'er findes i repoet og i `dist/`, ingen dubletter, 404.html holdes ude), modstykker på tværs af sprog med gensidigt hreflang, `lang`-attribut, `canonical` peger på siden selv, robots.txt peger på sitemap.

To ting fandt testen straks og de er rykket ud i planens opgave 2 og 3:
- QR-kodningen af `æøå` er ødelagt (enkeltbytes uden ECI).
- Kalender-datoer flytter en dag ved midnat.

`test/` kører alene uden build: `node --test`.

## 2026-10-09 — ceo/wifi-scan-guide (afkrydset opgave 3)

WiFi-siden er danses største underside (10 besøgende/28d, 8 indgange, bounce 100 %) og
havde intet om det, folk rent faktisk spørger om: hvordan scanner man koden. Sektionen
"Sådan fungerer det" handlede om at *lave* koden. Ny sektion med iPhone- og
Android-gennemgang + caset for telefoner før Android 10, og JSON-LD: to HowTo (én pr.
platform) og ét FAQPage med de fem allerede synlige spørgsmål i samme rækkefølge.

Verificeret: `npm test` 57/57 grøn. De 6 nye tests i `test/wifi-content.test.js` er
kørt mod master uden ændringerne — 5 af 6 fejler dér. Fakta om iOS 11 / Android 10 er
tjekt op imod Apples og Googles dokumentation, ikke husket. Ingen ny CSS: sektionen
bruger `.content-block` og `.guide-list`, som siden allerede bruger.

## 2026-10-09 — Cache-busting af app.js/style.css (ceo/cache-bust-assets)

Datagrund: live `/app.js?v=8` var 61.834 B med `cf-cache-status: HIT` og
`last-modified: 03 Oct` — mens origin bag Cloudflare serverede den friske
fil (62.038 B, `last-modified: 09 Oct 05:41`, med `stringToBytesFuncs`).
Et nyt query-parameter gav `MISS` og den friske fil. Altså: origin havde
dagens rettelser (æøå-kodning, kalenderdato, vCard-escaping), men hver
bruger fik den gamle fil, fordi `nginx.conf` giver `.js`/`.css`
`max-age=604800` (7 dage) og Cloudflare cacher pr. fuld URL — og HTML'ens
`?v=8` var hardkodet og blev aldrig bumpet ved deploy.

Rettelse: `build-version.js` harher (sha256, 10 tegn) over de byggede
`app.js`, `style.css` og `lib/qrcode.js`; `build.js` stempler tokenet på
hver `href`/`src` i `dist/` og på `sw.js` (både `?v=` og `CACHE_NAME`), så
en ændret fil får en ny URL og et cache-miss. `?v=8` i kilderne er nu bare
en pladsholder, som buildet overskriver.

Verificeret: `npm test` 60/60 grøn. `test/cache-busting.test.js` (3 tests)
fejler mod den gamle build (dist pegede på `?v=8`), og den ene test beviser
at hashen ændrer sig, når `app.js` ændres. Cloudflare bekræftet manuelt:
`?v=8` = HIT (gammel), nyt token = MISS (ny fil).

## 2026-10-09 — Undersider med substans: vCard og kalender
Gennemført i ceo/vcard-kalender-substans. vCard- og kalender-siderne (DA+EN) fik
HowTo- og FAQPage-structured-data samt en praktisk sektion ("Sådan gemmer modtageren
dit kort" / "Sådan tilføjer deltagerne begivenheden") med iPhone- og Android-trin,
svarende til WiFi-siden. Gate: `npm test` 60/60 grøn.
MÅL: `/vcard-qr-kode` baseline 6 besøgende, bounce < 80 % pr. 2026-11-05.

## 2026-10-09 — Historik som tilvalg
Landområde: `bevaret/2026-10-auto-union-night` (1). Gemning af QR-indhold i localStorage er nu slået
fra som standard; brugeren sætter flueben i "Gem nye QR-koder i historikken under dette besøg".
Privatlivspolitik og om-siden opdateret. Gate: `npm test` grøn.

## 2026-10-09 — Scan-kontrol af den færdige kode
Gennemført i ceo/scan-check. `decodeQRCanvas()` læser pixelsne fra den færdige kode tilbage med
`lib/jsQR.min.js` (samt `inversionAttempts: 'attemptBoth'`) op til 250 ms efter generering, så
indtastning aldrig hakker. Resultatet vises som en status under QR-koden: kan scannes, indholdet
stemmer / advarsel med konkret råd. Transparent baggrund lægges på hvid før læsning, for ellers
tæller gennemsigtige pixels som sort. Formatet SVG får en usynlig canvas-kopi, for kontrollen
læser pixels.

Målinger bag beslutningen (lokal, med ægte qrcode-matricer): alle seks farve-presets dekoder,
så der er ingen fejlalarmer på standardindstillinger. #cccccc på hvid fejler (rigtig advarsel),
logo der dækker 35 % fejler ved fejlkorrektion L og M og går igennem ved H — netop det boost
logoet allerede udløser. Prik-stil dekoder ved 512 px.

Ny testfil `test/scan-check.test.js` (11 tests) og nye bindinger i `test/helpers/load-app.js`
(`generateQRCode`, `updateScanStatus`, `decodeQRCanvas`, `scanStatus`, `setScanCanvas`);
`ClassList` i dom-stubben har nu `replace`, som `showToast` bruger.
Gate: `npm test` 71/71 grøn.

Kendt problem der ikke er løst her: `drawCanvas` giver ikke den 4 modulers hvide kant, som
QR-standarden kræver — det er opgave 2 i planen.

## 2026-10-09 — Hvid zone om koden i downloads
Gennemført i ceo/quiet-zone. `drawCanvas` regner nu den påkrævede hvide kant med i
størrelsen: `scale = size / (cells + 8)` og modulerne tegnes fra `(x + 4) * scale`, så hver
kanvas — preview, download, batch, print, kopi og del — får fire modulers lys kant.
`toSvgString` kaldes med kant 4 i stedet for 2, både i enkeltgenereringen og i batch-ZIPen.
Preview-koden bliver ca. 18 % mindre i samme boks, men billedet er stadig den valgte
størrelse, og koden rammer ikke længere billedkanten.

Transparent baggrund efterlades transparent i kantzonen (brugerens valg), men JPG og PDF
fylder alligevel hvid, fordi de uanset lægger en hvid baggrund under. Den dekorative
QR-logo i headeren (linje 610) bruger stadig `size / cells` — den er pynt, ikke en kode.

Ny testfil `test/quiet-zone.test.js` (7 tests) med en canvas-stub med rigtige pixels:
kanten er baggrundsfarven i alle fire retninger, koden dekoder stadig med jsQR, zonen
følger den valgte baggrundsfarve, prik- og rundet stil holder zonen, SVG'en får
`viewBox` med 8 modulers margin, og modulerne i download-canvasen ligger alle inden for
margenen. Seks af de syv tester fejler mod gammel kode (kun jsQR-testen går igennem).
Gate: `npm test` 78/78 grøn.

## 2026-10-09 — esbuild 0.27.7 → 0.28.1
Dependabot-PR #2 landet som squash-commit. Kun package.json og package-lock.json ændres;
esbuild bygger og minificerer uændret, og der er ingen runtime-afhængighed i spillet.
Gate kørt med 0.28.1 installeret lokalt: `npm test` 71/71 grøn (testtallet er fra den gren
PR'en stod på, før kviet-zonen tilføjede sine syv tests).

## 2026-10-09 — share-billeder (og:image) til alle sider
Alle sider deklarerede en og-image, men ingen af filerne fandtes — alle syv URL'er
returnerede 404 på https://qrtool.dk, så enhver deling (Facebook er 36 % af trafikken,
46 af 206 besøgende/28 d) landed uden preview-billede. Engelske sider pegede desuden
på de danske kort.
Fix: `og-images.js` genererer 14 kort (1200×630) med rsvg-convert efter sitets egne
farver (#0f172a/#1e293b, #6366f1/#8b5cf6) og QR-motivet fra icon.svg; PNG'erne
committes som statiske asseter og kopieres af build.js, fordi Docker-staget ingen
rasteriserer har. EN-sider fik egne `og-image-*-en.png`. Ny test i test/site.test.js
fejler, hvis et deklareret og-image mangler i repo eller dist/ (bevist: testen fejler
med filerne fjernet, 110/110 med dem på plads).

## Ældre afsluttede opgaver (konserveret fra planens kø)
- Scan-kontrol af den færdige kode før download — ceo/scan-check (2026-10-09).
- Hvid stillezone om koden i PNG/SVG/JPG/PDF — ceo/quiet-zone (2026-10-09).
- Download i millimeter med 300 dpi og præcis PDF-størrelse — ceo/print-size-mm (2026-10-09).
- Engelsk forside: generatoren først — allerede opfyldt, håndhævet af test.

## 2026-10-10 — vCard-siden skrevet om til "digitalt visitkort"-søgningerne
GSC (2026-09-09–10-07): `/vcard-qr-kode` 121 visninger, 0 klik, CTR 0,0 %, pos. 13,0 — men
"digitalt visitkort" pos. 9 (16v) og "digitalt visitkort iphone" pos. 10 (25v), og
"/guides/visitkort-med-qr-kode" 6v pos. 32. Siden rankede altså allerede på de præcise
søgninger, uden at titel eller beskrivelse lovede iPhone/Android.
Fix: title "Digitalt Visitkort med QR-Kode til iPhone & Android | QRTool.dk" (DA) og "Digital
Business Card QR Code for iPhone & Android | QRTool.dk" (EN), ny meta description og keywords,
og to nye FAQ'er i både synlig tekst og FAQPage-schema: hvordan modtageren får kortet på
iPhone (kamera → bjælke → Gem, uden app) og hvor stort QR-koden skal være på et fysisk
visitkort (min. 2×2 cm, helst 3×3 cm, bagsiden af et 85×55 mm-kort, SVG til print).
DA+EN i samme commit; gate 116/116 (6 nye tests i test/vcard-content.test.js holder titel,
beskrivelse, FAQ-sync og printstørrelse på plads i begge sprog).

## 2026-10-10 — CSV-batch-import forstår nu flere kolonner
Den gamle import tog blindt den første kolonne i hver række, så et typisk "navn, url"-eksport
fra Excel/Sheets kodede navnet i stedet for linket — uden at brugeren fik det at vide.
Nu: rigtig CSV-parser (anførselstegn med indlejret delimiter/linjeskift, "" som ét anførselstegn,
BOM, CRLF), delimiter fundet ud fra første linje (komma/semikolon/tab), og kolonnevalg der
foretrækker en genkendt header (url/link/tekst/…) og ellers den kolonne med flest URL-agtige
værdier (ellers længste værdier). Brugeren får besked om hvilken kolonne der blev brugt, og
importen stopper ved 100 rækker (batch-grænsen). DA+EN. Gate 131/131 (16 nye tests i
test/csv-import.test.js). Opgaven stod som åben #1 i planen.

## 2026-10-10 — QR-type-undersiderne har nu forsidens print- og scanværktøjer
De seks QR-type-undersider (wifi, vcard, email, sms, kalender, tekst) og deres tolvte en/-spejle
havde hver deres lille inline-script med kun PNG/SVG-download: ingen hvid stillezone, ingen
printstørrelse, ingen PDF, ingen scan-kontrol. Det var præcis det, gæster trykker fra, og siderne
bærer 900+ GSC-visninger pr. måned.
Fix: delt modul `lib/qr-page.js` — samme tegning som forsiden (4 modulers hvid kant,
fejlkorrektion H), printstørrelse i mm → 300 dpi i PNG/JPG/WebP, PDF i præcis fysisk størrelse
eller A4, JPG flættet på hvid, og en rådgivende scan-kontrol (jsQR) efter generering. Alle tolv
sider bruger modulet; `build.js` minifierer det, `sw.js` pre-cacher det, `build-version.js`
cache-buster det. DA+EN: også kopien om formater ("Download som PNG eller SVG" var blevet forkert
med fem formater) og PDF/JPG/WebP i formatvælgeren.
Gate 159/159 (22 nye tests): `test/subpage-features.test.js` dækker mm-omregning, PDF-geometri og
xref-offsets, quiet zone i canvas og SVG, at jsQR kan læse koden tilbage, uden jsQR sker ingen
kontrol, og sprogvalg; `test/site.test.js` tvinger wiring, formater og oversat kopi på alle 12
sider.

## 2026-10-10 — SMS-siden får en scanning-vejledning og strukturerede data
GSC viser "hvordan opretter jeg en sms-kode" på position 29 (7 visninger) og 34 (3 visninger)
uden klik, og siden havde kun en HTML-FAQ uden strukturerede data — altså intet søgemaskinerne
kunne vise som rich result. Now: synlig vejledning "Sådan scanner du en SMS QR-kode" med trin
for iPhone (iOS 11+, "Scan QR-koder" skal være slået til i Indstillinger → Kamera) og Android
(Android 10+, kamera-appen læser koden direkte), et afsnit om beskeder over 160 tegn, to
HowTo-noder (én pr. platform) og FAQPage-JSON-LD med de seks synlige spørgsmål — heraf ét nyt
("Hvordan opretter jeg en SMS QR-kode?"). DA+EN. Gate 166/166 (7 nye tests i
test/sms-content.test.js; 6/7 fejler på master). Datagrund: GSC-søgningerne ovenfor, samt
MÅL: `/sms-qr-kode` CTR 3,9 % (102v, 4 klik, pos. 10,7) → over 6 % pr. 2026-10-24.
- App-store-link som QR-type ("App"-fane: App Store/Google Play-link fra ID eller indsat link,
  live forhåndsvisning) — ceo/app-link (2026-10-09).

## 2026-10-10 — Batch-eksport med PDF i trykkvalitet
Valgte brugeren PDF i batch-downloaden, fik de en ZIP med PNG-bytes og filendelsen .pdf — en
fil ingen printer kunne åbne. Nu laves én rigtig PDF pr. kode, i den valgte printstørrelse
(300 dpi) eller på A4, og JPG får korrekt image/jpeg. DA+EN. Gate 137/137 (6 nye tests).
Verificeret live 2026-10-10 (ZIP med PDF'en i valgt størrelse).
## 2026-10-10 — Kalendersidens vejledning og oprettelses-FAQ (ceo/kalender-howto-faq)
Siden voksede +500 % fra et lille grundlag (6 besøgende/28 d) og Search Console viste "qr code
calendar event" (34 visninger, pos. 14), "qr code to add calendar event" (26, pos. 15) og
"calendar qr code" (29, pos. 17) uden ét klik. Siden havde allerede
scan-vejledningen + HowTo/FAQPage-data fra e0a128d, men intet svar på det mest
grundlæggende spørgsmål — hvordan koden oprettes — og ingen links videre til de andre
QR-typer. Nu er "Hvordan opretter jeg en kalender QR-kode?" første FAQ (synlig og i
FAQPage-JSON-LD, seks spørgsmål i alt), og der er et internt link-afsnit til de fem andre
generatorer. MÅL: `/en/calendar-qr-code` CTR fra 0,4 % (566v, 2 klik, pos. 11,0) til over
2 % pr. 2026-10-24. DA+EN. Gate 173/173 (7 nye tests i test/kalender-content.test.js, 2 af
dem fejlede på master).

## 2026-10-10 — A4-print-ark i batch-eksporten (ceo/batch-print-ark)
Batch kunne kun give én fil pr. kode (ZIP), så brugere med mange koder måtte printe dem
enkeltvis. Nu kan hele batch'en downloades som ét A4-print-ark (PDF) med koderne i et
gitter og teksten under hver — til mærkater og ark. Gitteret tilpasser sig antallet
(2–6 kolonner) og rummer op til 42 koder pr. ark; er der flere, vises en besked (flersidet
ark er en selvstændig opgave). Genbruger den eksisterende PDF-builder ved at tegne hele
arket på ét 300 dpi A4-canvas (2480×3508) og lægge det på siden. DA+EN. Gate 184/184
(5 nye tests i test/batch-sheet.test.js). Datagrund: planens feature-kø; batch er til
brugere med mange koder.

## 2026-10-10 — Email-siden får scanner-vejledning og strukturerede data (ceo/email-guide)
Search Console viste "email qr code" (35 visninger, pos. 11), "qr code email" (13, pos. 18) og
"qr code for email" (10, pos. 12) med 3 klik i alt (CTR 1,0 %), mens siden hverken fortalte
en bruger, hvad der sker efter scan — eller gav søgemaskiner noget at vise. Nu er der et
synligt afsnit "Sådan sender dine kunder en email med ét scan" med trin for iPhone og for
Android, et afsnit om telefoner der ikke læser mailto-koder, to HowTo-noder (én pr. platform)
og FAQPage-JSON-LD med de seks allerede synlige spørgsmål — i samme rækkefølge, så markup og
tekst ikke driver fra hinanden. DA+EN. Gate 193/193 (9 nye tests i test/email-content.test.js,
8 af 9 fejlede på master — de tjekker bl.a. at markerede og synlige FAQ'er er identiske og i
samme rækkefølge, og at "300 tegn"-påstanden er den samme i tekst og markup).
MÅL: `/en/email-qr-code` CTR fra 1,0 % (299v, 3 klik, pos. 8,9) til over 3 % pr. 2026-11-05.

## 2026-10-10 — Telefon- og WhatsApp-QR-koder i generatoren (ceo/phone-whatsapp-qr)
Feature-køens øverste punkt: konkurrenter tilbyder telefon- og WhatsApp-koder, vores
generator manglede begge. Ny fane "Telefon" (tel:-link bygget fra det tastede nummer —
mellemrum, punktummer og streger fjernes, + landekode bevares, og under seks cifre
afvises) og WhatsApp som platform i Social-fanen (wa.me-link, kun cifre; navne uden
cifre afvises). Begge sprog; live-preview viser linket mens der skrives. Accept: ny fane
+ test. Gate 204/204 (11 nye tests i test/phone-link.test.js, 6 af 11 fejlede på master).

## 2026-10-10 — Print-arket deler store batches over flere A4-sider (ceo/multi-page-print-sheet)
Print-arket kunne højst rumme én side: en batch på 43 koder eller flere blev afvist med
"Print-arket kan højst rumme 42 QR-koder ad gangen", selvom preview og ZIP godt kunne
100. Nu deler `sheetPages()` batchen i A4-sider (layoutet vælges ud fra hele batchen, så
alle sider har samme gitter), og `buildMultiPageSheetPDF()` bygger én PDF med en side pr.
ark — objektmodel, indholdsstrøm, billed-XObject og xref-tabel fra bunden, så tre kanvasser
bliver tre sider i én fil. Canvaserne konverteres én ad gangen (ét A4-canvas ved 300 dpi
er ~35 MB), så en batch på 100 ikke holder alle sider i hukommelsen — vigtigt på mobil.
Toast'en fortæller nu både antal koder og antal sider, og der er en synlig hjælpetekst
under knappen. DA+EN. Gate 208/208 (9 tests i test/batch-sheet.test.js; 4 af dem fejler på
master — herunder klik-testen, der downloader en 100-koders batch og tæller sider i PDF'en,
og et xref-tjek, der afslørede en reel off-by-one i den nye builder: xref-tabellen påstod
et objekt for meget).

## 2026-10-11 — Download-knappen ved resultatet på alle typer (ceo/result-first-subpages)
Forsiden fik 2026-10-10 sin download-knap flyttet fra inputsektionen til `.preview-actions`
under QR-resultatet, men de 12 QR-typesider (wifi, vcard, kalender, sms, email, tekst — DA
+ EN) havde den stadig ved felterne. Det er præcis de sider, Google sender trafik til:
1 235 visninger i 28 dage (`/en/calendar-qr-code` 531, `/en/email-qr-code` 299,
`/vcard-qr-kode` 118, `/sms-qr-kode` 99, `/wifi-qr-kode` 95, `/tekst-qr-kode` 93), og på
mobil ligger forudsigtningsboksen under formularen, så knappen lå uden for syn. Samme
behandling på alle 14 generatorsider nu, og `test/site.test.js` låser det: Download skal
komme efter `qrPreview`, ligge i `.preview-actions`, og der må være præcis én pr. side
(fejler på master, grøn med rettelsen). Scroll-til-resultat-logikken i `app.js` var
generisk og virkede allerede på undersiderne. Gate 210/210.

## 2026-10-11 — Google-anmeldelse som QR-type (ceo/google-review-qr)
Brugere, der vil have kunder til at skrive en Google-anmeldelse, måtte i dag bygge
review-linket i hånden eller gå til en konkurrent (reviewfire, qrchameleon m.fl.
tilbyder alle "Google review QR"). Nyt fane "Anmeldelse" (DA) / "Review" (EN) på `/`
og `/en/`: indtast et Place-ID (starter med `ChIJ`, fx `ChIJN1t_tDeuEmsRUsoyG83frY4`)
eller indsæt et helt link. Bygger
`https://search.google.com/local/writereview?placeid=<id>` og forhåndsviser det live.
Et indsat Google-link med `placeid=`/`place_id=` normaliseres til review-formularen, så
en kopieret "skriv en anmeldelse"-link virker direkte. Valideringen afviser ids uden
`ChIJ`-præfiks frem for at generere en kode, der fører til en Googlesøgning — Place-ID'et
findes i Googles officielle Place ID Finder (linket står i feltets hjælpetekst).
Gate 226/226; 11 nye tests i `test/google-review.test.js` fejler på master, og
`test/qr-roundtrip.test.js` fik et Google-anmeldelse-tilfælde, der dekoder tilbage til
review-linket i alle fire fejlkorrektionsniveauer.

## 2026-10-11 — CTR-løft på /tekst-qr-kode (ceo/tekst-url-seo)
Search Console: 93 visninger, 0 klik, position 30,8. De konkrete søgninger er
"url kode" (pos. 20), "statisk qr kode" (pos. 29), "gratis qr kode" (pos. 68) og
"qr kode" (pos. 75) — altså holder siden sig til emnet "url/tekst til QR-kode"
uden at nævne det, folk søger på: at koden er statisk og kun er til URLs. Titel,
H1, hero-overskrift, beskrivelse, JSON-LD (SoftwareApplication name +
description) og delkort (og/twitter) siger nu det samme i begge sprog:
"URL til QR-Kode – Statisk QR-Kode med Tekst | QRTool.dk" (57 tegn, inden for
Googles ~60). Påstanden "koden virker for altid" holder for en statisk kode —
indholdet ligger i koden selv, og der er hverken login eller abonnement
(klient-side, ingen backend). `test/tekst-seo.test.js` (6 tests) låser
titel-længde, at titel nævner URL+statisk, beskrivens længde og pointer,
og at `<title>`, meta title, og/twitter og JSON-LD er identiske. 5 af de 6
fejlede på master. Gate 232/232.

## Digitalt-visitkort-eksempel på /vcard-qr-kode (2026-10-11, ceo/vcard-example)

Datagrund: 121 visninger/28 d, 0 klik, position 13,0 (GSC) og Plausible 5 besøgende
(+67 %) på siden; "digitalt visitkort iphone" pos. 9, "qr kode visitkort" pos. 23.
Brugeren så tomme felter og en placeholder og måtte forestille sig resultatet.
Derfor sidder der nu over formularen, på begge sprog: et fyldt eksempelkort
(navn, stilling, telefon, e-mail, hjemmeside, adresse), en rigtig QR-kode der
kan scannes med det samme (fire modulers hvid kant efter QR-standarden) og en
knap "Udfyld med eksempel" der fylder alle otte felter og generer koden.
Samme commit flytter escVcard-escaping (`\ ; , :`) ind i sidens egen vCard-bygger,
så et navn med semikolon eller komma ikke længere knækker N-linjen — førhen
skete der intet, og det var den eneste uescapede generator på sitet (app.js
havde escaped længe). `test/vcard-example.test.js` (10 tests) låser blokkens
placering over formularen, kortets værdier mod scriptets VCARD_EXAMPLE, at
knappen udfylder alle felter og genererer, den præcise vCard-streng, at
eksemplet kan dekodes igen af jsQR, og escapingen. Alle 10 fejlede på master.
Gate 242/242. Layout følger de eksisterende 968/640 px-brydninger; repoet har
ingen Playwright, så der er ingen skærmbilleder.

## Download-knap ved resultatet på typerne og mobil-først (2026-10-11, ceo/mobile-first, ceo/result-first-subpages)

DEPLOY OK 2026-10-11 07:5x, verificeret på indhold: `preview-actions` findes på alle
12 QR-typesider (begge sprog), `local/writereview` i den live app.js, "Statisk QR-Kode
med Tekst" på /tekst-qr-kode og `vcardExampleQR` på /vcard-qr-kode og
/en/vcard-qr-code. Share-billederne giver nu 200 image/png på /og-image*.png, som
løser tidligere reviews fund (HØJ) om 404 på delte preview-billeder: den kørende
build var ældre end commit'et, og nu er 07:30-vinduets output verificeret direkte
på URL'erne med cache-bust.

`preview-actions` på /scan-qr-kode er 0 — siden er en scanner uden generator-resultat
og skal ikke have en download-knap.

## Print-klare bordopstillere i restaurationsguiderne (2026-10-11, ceo/restaurant-table-tents)

Datagrund: /guides/qr-koder-til-restauranter 66 visninger, 0 klik, CTR 0,0 %,
position 11,7 (GSC); /en/guides/qr-codes-for-restaurants 72 visninger, 0 klik,
position 18,4. Største enkeltsider uden for forsiden, der aldrig får et klik.
Guiderne beskrev QR-koder uden at vise én.

Derfor på begge sprog: ny title og description der nævner menukort, bordopstiller
og printstørrelse i mm (dette er de ord, GSC viser folk søger på); en ny sektion
"Sådan ser en bordopstiller ud" med to rigtige QR-koder, der tegnes i siden af
`lib/qrcode.js` fra `data-qr`-attributter med fire modulers hvid kant — en til
menukort (https://qrtool.dk/) og en WiFi-kode i formatet
`WIFI:T:WPA;S:...;P:...;;` — plus printvejledning (SVG eller PDF med størrelsen i
mm, mindst 4 × 4 cm, laminering); og et FAQ-svar på "Hvilke systemer skal jeg bruge
til QR-bestilling ved bordet?" (16 visninger, position 11) der peger på
kassesystemer med bord-QR (Lightspeed, iZettle, Trivec) og siger ærligt, at QR Tool
laver koderne og ikke bestillingsflowet. Guides-oversigternes korttekster er
opdateret til det samme. `test/restaurant-guide.test.js` (9 tests) låser title-
og description-ord, sektionen, FAQ-svaret, WIFI-formatet, sprogpariteten af
eksempelkoderne og at begge koder kan dekodes igen af jsQR efter at være tegnet
med hvid kant. Alle 9 fejlede på master. Gate 251/251. Ingen Playwright i repoet,
så 390 px-kolonnen er sikret via den eksisterende énkolonne-grid med 40rem-brud.

## Print-klart deltagerkort i events-guiderne (2026-10-11, ceo/event-attendee-card)

Datagrund: /guides/qr-koder-til-events 75 visninger, 0 klik, CTR 0,0 %, position
21,7; /en/guides/qr-codes-for-events 81 visninger, 1 klik, CTR 1,2 %, position 16,1.
De danske søgninger "qr kode léb" (21 visninger, position 49) og "qr stafet"
(3 visninger, position 45) peger på stafet/løb, hvor guiden intet havde at sige.

Derfor på begge sprog: ny title og description der nævner billetter, adgang og
stafet/relay; en ny sektion "Sådan ser et kort til deltagerne ud" med to rigtige
QR-koder, der tegnes i siden af `lib/qrcode.js` fra `data-qr` med fire modulers
hvid kant — en kalenderkode med et komplet VEVENT (SUMMARY, LOCATION, DTSTART
lørdag 12. juni 2027 09:00, DTEND 15:00, DESCRIPTION) og en WiFi-kode til
arrangementets gæstenetværk — plus printstørrelser (3-4 cm til bordkort,
15-20 cm til plakater); og et FAQ-svar på om QR-koder kan bruges til en stafet,
som siger ja til startliste, rutekort og afleveringspunkter og nej til live-timing.
`test/event-guide.test.js` (9 tests) låser title- og description-ord, sektionen,
FAQ-svaret, at VEVENT-strengen er gyldig (begge ende, VERSION, DTSTART/DTEND,
lokation) og at 12. juni 2027 rent faktisk er en lørdag (tjekket mod en kalender,
ikke mod testforfatterens hoved), samt at begge eksempelkoder kan dekodes igen af
jsQR efter tegning. Alle 9 fejlede på master. Gate 260/260.
