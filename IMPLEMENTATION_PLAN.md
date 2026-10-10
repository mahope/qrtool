# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- DEPLOY OK 2026-10-10 14:2x (verificeret på indhold): 12:30-vinduet deployede
  SMS-vejledningen. `/sms-qr-kode` og `/en/sms-qr-code` har på live afsnittet
  "Sådan scanner du en SMS QR-kode", to HowTo-noder og FAQPage-JSON-LD med seks
  spørgsmål. Alle tidligere afventende noter er lukket.
- Gate: `npm test` = `npm run build` + `node --test` (184 tests). 184/184 grønne pr. 2026-10-10 17:1x.
- 2026-10-10: Ny QR-læser som egen side `/scan-qr-kode` + `/en/scan-qr-code`
  (ceo/scan-page): kamera og billed-upload, dekodet lokalt med jsQR, resultat med
  kopiér/åbn-link, vejledning, FAQ og FAQPage/WebApplication-JSON-LD. Datagrund:
  GSC "scan qr kode gratis" 48 visninger, pos. 9, 0 klik — der manglede en
  landingsside for scanner-søgninger. Gate 179/179 (6 nye tests i
  test/scan-page.test.js).
- 2026-10-10: Batch kan nu downloades som ét A4-print-ark (PDF) med koderne i et gitter
  og teksten under hver (ceo/batch-print-ark): "Download print-ark (A4)" i batch-sektionen.
  Gitteret tilpasser sig antallet (2–6 kolonner), op til 42 koder pr. ark; flere viser en
  besked. DA+EN. Gate 184/184 (5 nye tests i test/batch-sheet.test.js).
- 2026-10-10: `/kalender-qr-kode` fået oprettelses-FAQ og interne links
  (ceo/kalender-howto-faq): "Hvordan opretter jeg en kalender QR-kode?" er nu første
  FAQ på siden og i FAQPage-JSON-LD (seks spørgsmål), og et nyt afsnit linker til de
  fem andre QR-typer. DA+EN. Gate 173/173 (7 nye tests i test/kalender-content.test.js,
  2/7 fejlede på master). Datagrund: GSC "qr code calendar event" pos. 14,
  "qr code to add calendar event" pos. 15, "calendar qr code" pos. 17 — ingen klik.
  MÅL: `/en/calendar-qr-code` CTR 0,4 % (566v, 2 klik, pos. 11,0) → over 2 % pr. 2026-10-24.
- MÅL: `/sms-qr-kode` CTR 3,9 % (102v, 4 klik, pos. 10,7) → over 6 % pr. 2026-10-24.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
- MÅL: Facebook-kilder 46 af 206 besøgende → 60+ pr. 2026-11-05 (share-preview rettet 2026-10-09).
- MÅL: `/scan-qr-kode` ny side, 0 besøgende/0 klik i dag (query "scan qr kode gratis"
  48v pos. 9) → CTR > 3 % pr. 2026-11-05.
- PR-TJEK 2026-10-10: ingen åbne PR'er.
- BRANCH-TJEK 2026-10-10: intet nyt at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 289 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 151 besøgende (+94 %), bounce 90 % — MÅL: bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 10, `/vcard-qr-kode` 6, `/sms-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 86, Google 56, Facebook 46, Bing 7 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. Ingen åbne. Næste kandidater (vælges efter effekt): vCard-sidens konvertering
   (0 klik ved 121 visninger), `/tekst-qr-kode` (93 visninger, pos. 30,8), eller
   `/` som værktøj først (151 besøgende, 90 % bounce).

Afsluttede opgaver (scan-kontrol, hvid zone, mm-download, EN-generator-først,
share-billeder, vCard-title/FAQ, CSV-import, batch-PDF, undersidernes print-/scan-værktøjer,
sms-vejledning, kalender-vejledning) står i `docs/plan-arkiv.md`.

### GSC-CTR-baselines (måles igen pr. 2026-10-23)
- `/en/calendar-qr-code` 566v, 2 klik, CTR 0,4 %, pos. 11,0 — største enkelt-side uden for `/`.
  MÅL: CTR > 2 % (oprettelses-FAQ + interne links landet 2026-10-10, ceo/kalender-howto-faq).
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
- **Flere QR-typer i generatoren:** telefon (`tel:`), WhatsApp og Google Maps-anmeldelse.
  Datagrund: konkurrenter tilbyder dem, og de mangler i fanerne. Accept: ny fane + test.
- **Print-ark over flere sider:** arket tager i dag ét A4-ark (op til 42 koder). Del op i
  sider, så en batch på 100 også kan printes samlet. Accept: 100 koder → flersidet PDF.
- **CTR-løft på `/tekst-qr-kode`:** 93v, pos. 30,8, 0 klik. Omskriv title/description mod
  "url kode"/"statisk qr kode". MÅL: CTR > 2 % pr. 2026-11-05.
- **vCard-konvertering:** 121v, 0 klik, pos. 13. Efter title/FAQ-landingen måles CTR igen;
  hvis stadig 0, byg et digitalt-visitkort-eksempel ind på siden.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik — landet 2026-10-09 i
ceo/history-opt-in. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår.
(3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten
får opmærksomhed.

## Verificér deploy
- VERIFICÉR DEPLOY: oprettelses-FAQ og interne QR-type-links på `/kalender-qr-kode` og
  `/en/calendar-qr-code` · ceo/kalender-howto-faq 2026-10-10 14:4x — merge ligger før vinduet
  17:30. Tjek på live at FAQ'en "Hvordan opretter jeg en kalender QR-kode?" er synlig som
  første spørgsmål og at FAQPage-JSON-LD har seks spørgsmål.
- VERIFICÉR DEPLOY: ny QR-læser-side `/scan-qr-kode` og `/en/scan-qr-code` (kamera +
  billed-upload, FAQ, strukturerede data) · ceo/scan-page 2026-10-10 15:4x — merge ligger
  efter vinduet 12:30, så tjek først efter 17:30. Verificér på live at siden svarer 200, at
  knapperne "Start kamera"/"Upload billede" findes, og at FAQPage-JSON-LD har seks spørgsmål.
- VERIFICÉR DEPLOY: A4-print-ark i batch-sektionen på `/` og `/en/` · ceo/batch-print-ark
  2026-10-10 17:1x — merge ligger før vinduet 17:30, tjek efter 17:30. Verificér på live at
  knappen "Download print-ark (A4)" findes i batch-sektionen på begge forsider.
