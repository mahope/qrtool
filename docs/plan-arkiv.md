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
