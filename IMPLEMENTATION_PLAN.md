# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- DEPLOY OK 2026-10-10 19:3x (verificeret på indhold): 17:30-vinduet bragte
  kalender-FAQ'en, scanner-siden og batch-print-arket live — FAQ-spørgsmålet synligt på
  `/kalender-qr-kode`, HowTo/FAQPage-JSON-LD på `/en/calendar-qr-code`, "Start kamera"
  på `/scan-qr-kode` og `/en/scan-qr-code`, "Download print-ark" i batch på `/` og `/en/`.
  Alle share-billeder (og-image*.png) giver nu 200 image/png med cache-bust, så reviewets
  afventer-note for dem er lukket.
- 2026-10-10: `/email-qr-kode` + `/en/email-qr-code` har fået en scanner-vejledning med
  to HowTo-noder og FAQPage-JSON-LD over de seks synlige spørgsmål (ceo/email-guide).
  Datagrund: GSC "email qr code" 299v, 3 klik, CTR 1,0 %, pos. 8,9.
- Gate: `npm test` = `npm run build` + `node --test` (193 tests). 193/193 grønne
  pr. 2026-10-10 19:3x.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
- MÅL: Facebook-kilder 46 af 206 besøgende → 60+ pr. 2026-11-05 (share-preview live).
- MÅL: `/en/calendar-qr-code` CTR 0,4 % (566v, 2 klik, pos. 11,0) → over 2 % pr. 2026-10-24.
- MÅL: `/sms-qr-kode` CTR 3,9 % (102v, 4 klik, pos. 10,7) → over 6 % pr. 2026-10-24.
- MÅL: `/en/email-qr-code` CTR 1,0 % (299v, 3 klik, pos. 8,9) → over 3 % pr. 2026-11-05.
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

1. Ingen åbne. Næste kandidater (vælges efter effekt): vCard-sidens konvertering
   (0 klik ved 121 visninger), `/tekst-qr-kode` (93 visninger, pos. 30,8), eller
   `/` som værktøj først (151 besøgende, 90 % bounce).

Afsluttede opgaver (scan-kontrol, hvid zone, mm-download, EN-generator-først,
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
- DEPLOY OK 2026-10-10 19:3x: kalender-FAQ (ceo/kalender-howto-faq), scanner-sider
  (ceo/scan-page), batch-print-ark (ceo/batch-print-ark) og share-billederne
  (ceo/og-images) bekræftet på live ved indholdstjek — se STATUS.
- VERIFICÉR DEPLOY: scanner-vejledning "Sådan sender dine kunder en email med ét scan"
  og FAQPage-JSON-LD med seks spørgsmål på `/email-qr-kode` + `/en/email-qr-code`
  · ceo/email-guide 2026-10-10 20:0x — merge ligger før vinduet 21:30. Tjek efter 21:30
  at afsnittet er synligt og at FAQPage-JSON-LD har seks spørgsmål.
