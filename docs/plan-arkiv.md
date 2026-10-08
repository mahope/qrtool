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
