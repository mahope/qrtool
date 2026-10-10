# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- DEPLOY OK 2026-10-10 09:5x (verificeret på indhold): 07:30-vinduet deployede sent (byggetid
  05:43 UTC = 07:43 CEST). Alle 14 share-billeder giver 200 + image/png med cache-bust; live
  `app.js` indeholder `csvToBatchValues`; `lib/qr-page.js` er live og hentes af alle seks
  undersider; `/wifi-qr-kode` peger på `og-image-wifi.png`. Alle afventende noter er lukket.
- Gate: `npm test` = `npm run build` + `node --test` (166 tests). 166/166 grønne pr. 2026-10-10 11:5x.
- 2026-10-10: SMS-siden har nu en vejledning (ceo/sms-howto-faq): "Sådan scanner du en SMS
  QR-kode" med trin for iPhone og Android, to nye HowTo-noder og FAQPage-data med de synlige
  spørgsmål, plus ét nyt FAQ om at oprette koden. DA+EN. Gate 166/166 (7 nye tests i
  test/sms-content.test.js, 6/7 fejler på master). Datagrund: GSC giver
  "hvordan opretter jeg en sms-kode" på pos. 29 (7 visninger) og pos. 34 (3 visninger) uden klik,
  og siden havde kun HTML-FAQ uden strukturerede data.
  MÅL: `/sms-qr-kode` CTR 3,9 % (102v, 4 klik, pos. 10,7) → over 6 % pr. 2026-10-24.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
- MÅL: Facebook-kilder 46 af 206 besøgende → 60+ pr. 2026-11-05 (share-preview rettet 2026-10-09).
- PR-TJEK 2026-10-09: dependabot-PR #2 (esbuild 0.27.7 → 0.28.1) landet som squash-commit.
  Ellers ingen åbne PR'er, ingen GitHub Actions — den lokale gate er eneste kontrol.
- BRANCH-TJEK 2026-10-09: kun master + `bevaret/*`, intet at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 289 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 151 besøgende (+94 %), bounce 90 % — MÅL: bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 10, `/vcard-qr-kode` 6, `/sms-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 86, Google 56, Facebook 46, Bing 7 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. Byg vejledningen på `/kalender-qr-kode` ud som wifi- og sms-siden fik (kalender: 6 besøgende
   +500 %): "sådan scanner gæster", FAQ med strukturerede data og interne links til de andre
   QR-typer. Accept: how-to-sektion + FAQPage-data med mindst tre spørgsmål, DA+EN, gate grøn.
   Datagrund: samme mønster som sms-siden (GSC "hvordan opretter jeg en sms-kode" trak klik
   efter vejledningen) og +500 % vækst på kalender-siden uden noget indhold at lande på.

Afsluttede opgaver (scan-kontrol, hvid zone, mm-download, EN-generator-først,
share-billeder, vCard-title/FAQ, CSV-import, batch-PDF, undersidernes print-/scan-værktøjer,
sms-vejledning) står i `docs/plan-arkiv.md`.

### GSC-CTR-baselines (måles igen pr. 2026-10-23)
- `/en/calendar-qr-code` 566v, 2 klik, CTR 0,4 %, pos. 11,0 — største enkelt-side uden for `/`.
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

### Feature-kø
- ✅ **App-store-link som QR-type.** Landet 2026-10-09 i ceo/app-link.
- ✅ **Kontrastmåling i farvevælgeren.** Landet 2026-10-09 i ceo/contrast-readout: farveområdet
  viser WCAG-kontrastforholdet mellem kode og baggrund live (advarsel under 3:1), DA+EN.
- ✅ **PDF i trykkvalitet i batch.** Landet 2026-10-10 i ceo/batch-pdf.
- ✅ **Samme funktioner på QR-type-undersiderne.** Landet 2026-10-10 i ceo/subpage-print-scan:
  printstørrelse, PDF, JPG/WebP, scan-kontrol og hvid zone på alle 12 undersider via
  `lib/qr-page.js`. Accept (300 dpi PDF fra `/wifi-qr-kode`) dækket af test/subpage-features.test.js.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik — landet 2026-10-09 i
ceo/history-opt-in. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår.
(3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten
får opmærksomhed.

## Verificér deploy
- VERIFICÉR DEPLOY: SMS-vejledning, HowTo- og FAQPage-data på `/sms-qr-kode` og `/en/sms-qr-code`
  ceo/sms-howto-faq 2026-10-10 12:0x — merge ligger før vinduet 12:30. Tjek på live at siden
  indeholder afsnittet "Sådan scanner du en SMS QR-kode", to HowTo-noder og FAQPage-JSON-LD.
  To vinduer uden live = DEPLOY-MISSING + stop for merge til master.
