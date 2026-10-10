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
