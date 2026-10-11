# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- DEPLOY OK 2026-10-10 23:2x (verificeret på indhold): 21:30-vinduet bragte
  telefon-/WhatsApp-fanen (ceo/phone-whatsapp-qr) og email-scanner-vejledningen
  (ceo/email-guide) live — "Telefon"-fanen og wa.me i den live app.js, "ét scan"-
  afsnittet og FAQPage-JSON-LD med seks spørgsmål på begge sprog. Share-billederne
  giver fortsat 200 image/png (19:3x og 23:2x).
- 2026-10-11: download-knappen ved resultatet på alle 12 QR-typesider (ceo/result-first-subpages).
- Gate: `npm test` = `npm run build` + `node --test` (232 tests). 232/232 grønne
  pr. 2026-10-11 03:5x.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
- MÅL: Facebook-kilder 46 af 206 besøgende → 60+ pr. 2026-11-05 (share-preview live).
- MÅL: `/en/calendar-qr-code` CTR 0,4 % (566v, 2 klik, pos. 11,0) → over 2 % pr. 2026-10-24.
- MÅL: `/sms-qr-kode` CTR 3,9 % (102v, 4 klik, pos. 10,7) → over 6 % pr. 2026-10-24.
- MÅL: `/en/email-qr-code` CTR 1,0 % (299v, 3 klik, pos. 8,9) → over 3 % pr. 2026-11-05.
- MÅL: typesiderne samlet 1 235 visninger/28 d (GSC) med Download ved inputfeltet → flyttet
  til resultatet 2026-10-11 (ceo/result-first-subpages). Måles som scroll-depth/bounce pr. 2026-11-05.
- MÅL: `/scan-qr-kode` ny side ("scan qr kode gratis" 48v pos. 9) → CTR > 3 % pr. 2026-11-05.
- PR-TJEK 2026-10-10: ingen åbne PR'er.
- BRANCH-TJEK 2026-10-10: intet nyt at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 289 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 151 besøgende (+94 %), bounce 90 % — MÅL: bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 10, `/vcard-qr-kode` 6, `/sms-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 86, Google 56, Facebook 46, Bing 7 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. Digitalt-visitkort-eksempel på `/vcard-qr-kode`: siden har 121 visninger/28 d (GSC),
   0 klik, position 13,0 — og søger på "digitalt visitkort iphone" (pos. 9) og
   "qr kode visitkort" (pos. 23). Accept: et fyldt, synligt eksempel på siden, så
   brugeren ser produktet før de udfylder felter; CTR > 2 % pr. 2026-11-05.

Afsluttede opgaver (download-knap ved resultatet på alle typer, telefon-/WhatsApp-QR,
multi-side print-ark, scan-kontrol, hvid zone, mm-download, EN-generator-først,
share-billeder, vCard-title/FAQ, CSV-import, batch-PDF, undersidernes print-/scan-værktøjer,
sms-vejledning, kalender-vejledning) står i `docs/plan-arkiv.md`.

### GSC-CTR-baselines (måles igen pr. 2026-10-23)
- `/en/calendar-qr-code` 566v, 2 klik, CTR 0,4 %, pos. 11,0 — største enkelt-side uden for `/`.
  MÅL: CTR > 2 % (oprettelses-FAQ + interne links landet 2026-10-10, ceo/kalender-howto-faq).
- `/en/email-qr-code` 299v, 3 klik, CTR 1,0 %, pos. 8,9 — scanner-vejledning + FAQPage-data
  landet 2026-10-10 (ceo/email-guide). MÅL: CTR > 3 %.
- `/vcard-qr-kode` 121v, 0 klik, CTR 0,0 %, pos. 13,0 — title/FAQ opdateret 2026-10-10 til
  iPhone/Android og visitkortstørrelse (ceo/vcard-title-faq). MÅL: CTR > 2 %.
- `/sms-qr-kode` 102v, 4 klik, CTR 3,9 %, pos. 10,7.
- `/en/guides/business-cards-with-qr-code` 100v, 0 klik, pos. 16,6.

### ❓ Til Mads
- **Playwright mangler.** Ingen skærmbillede-verifikation af UI-ændringer, kun HTML-gate.
  En devDependency på `@playwright/test` + axe ville give billeder ved 390/1280 px og en a11y-scanning.
- **Search Console mangler for qrtool.dk.** Ingen GSC-tilgang i snapshot-jobbet, så der bygges ikke
  på gæt om søgeord.
- **`file-saver` er erklæret i package.json men bruges ikke** i app.js eller noget HTML. Det er den
  eneste undtagelse fra reglen om ingen nye afhængigheder.

### Feature-kø (prioriteret)
- **`/` som værktøj først:** LANDET 2026-10-11 (ceo/mobile-first) og færdiggjort på alle
  typer 2026-10-11 (ceo/result-first-subpages). Accept: bounce under 75 % pr. 2026-11-05.
- **Google-Maps-anmeldelse som QR-type:** LANDET 2026-10-11 (ceo/google-review-qr).
  Accept: ny fane + test — 226/226 grønne, heraf 11 nye tests der fejler på master.
- **`/guides/qr-koder-til-restauranter`:** 67 visninger, pos. 11,7, 0 klik. Næststørste
  danske guide uden klik. Accept: CTR > 2 % pr. 2026-11-05.
- **CTR-løft på `/tekst-qr-kode`:** LANDET 2026-10-11 (ceo/tekst-url-seo). GSC 93v,
  pos. 30,8, 0 klik — "url kode" pos. 20, "statisk qr kode" pos. 29. Title/H1/H2,
  beskrivelse, JSON-LD og delkort siger nu "statisk QR-kode" og "URL til QR-kode"
  i begge sprog. CTR-baseline 0 % (93v, 0 klik) → MÅL: CTR > 2 % pr. 2026-11-05.
- **vCard-konvertering:** 121v, 0 klik, pos. 13. Efter title/FAQ-landingen måles CTR igen;
  hvis stadig 0, byg et digitalt-visitkort-eksempel ind på siden.


## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik — landet 2026-10-09 i
ceo/history-opt-in. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår.
(3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten
får opmærksomhed.

## Verificér deploy

- VERIFICÉR DEPLOY: download-knap ved resultat + scroll efter generering på `/` og
  `/en/` · ceo/mobile-first · 2026-10-11 00:4x. Verificér live: efter klik på
  "Generer" på mobil skal resultatet + download-knap være synlige uden scroll.
  Første batch-vindue efter merge: 07:30 2026-10-11.
- VERIFICÉR DEPLOY: Download-knappen sidder i `.preview-actions` under QR-resultatet på alle
  12 typesider (begge sprog) · ceo/result-first-subpages · 2026-10-11 02:0x.
  Verificér live: `curl -s https://qrtool.dk/wifi-qr-kode | grep -c 'preview-actions'` skal
  være 1, og samme for de øvrige typer. Første batch-vindue efter merge: 07:30 2026-10-11.
- VERIFICÉR DEPLOY: Anmeldelse-fanen (place-ID/link → `search.google.com/local/writereview`)
  på `/` og `/en/` · ceo/google-review-qr · 2026-10-11 03:3x. Verificér live:
  `curl -s https://qrtool.dk/app.js | grep -c 'local/writereview'` skal være 1. Første
  batch-vindue efter merge: 07:30 2026-10-11.
- Næste feature: `/vcard-qr-kode` mangler et digitalt-visitkort-eksempel (121v, 0 klik,
  pos. 13,0); "digitalt visitkort iphone" pos. 9.
- VERIFICÉR DEPLOY: `/tekst-qr-kode` + `/en/text-qr-code` title, H1, beskrivelse og
  delkort til "URL til QR-kode / statisk QR-kode" · ceo/tekst-url-seo · 2026-10-11 03:5x.
  Verificér live: `curl -s https://qrtool.dk/tekst-qr-kode | grep -o 'Statisk QR-Kode med Tekst'`
  skal give ét hit. Første batch-vindue efter merge: 07:30 2026-10-11.
