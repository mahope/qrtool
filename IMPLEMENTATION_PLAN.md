# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- Gate: `npm test` = `npm run build` + `node --test` (110 tests). 110/110 grønne pr. 2026-10-09 22:45.
- 2026-10-09: App-store-link som QR-type landet (ceo/app-link): ny "App"-fane der bygger
  App Store- og Google Play-links fra et ID eller et indsat link, med live forhåndsvisning. DA+EN.
- 2026-10-09: Share-billeder landet (ceo/og-images): alle 14 og-image.png fand 404, så enhver
  deling på Facebook (36 % af trafikken) manglede preview. Nye kort genereret af `og-images.js`
  (rsvg-convert, sitets farver), EN-sider fik egne `og-image-*-en.png`. Test fejler hvis et
  deklareret og-image mangler i repo eller dist.
- DEPLOY OK 2026-10-09 (verificeret på indhold): printstørrelse + 300 dpi/PDF, scan-kontrol, hvid
  zone, cache-bust, generator-først, vCard/kalender-undersider, historik som tilvalg, "App"-fanen
  og appPreviewUrl (ceo/app-link 18:15), kontrast-linjen under farvevælgeren (ceo/contrast-readout
  20:20) — live på `/` og `/en/` via `app.js?v=1abe2cffdb`.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
- MÅL: Facebook-kilder 46 af 206 besøgende → 60+ pr. 2026-11-05 (share-preview rettet 2026-10-09).
- PR-TJEK 2026-10-09 (2. gennemgang): dependabot-PR #2 (esbuild 0.27.7 → 0.28.1) landet som
  squash-commit. Ellers ingen åbne PR'er, ingen GitHub Actions — den lokale gate er eneste kontrol.
- BRANCH-TJEK 2026-10-09: kun master + `bevaret/*`, intet at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 289 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 151 besøgende (+94 %), bounce 90 % — MÅL: bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 10, `/vcard-qr-kode` 6, `/sms-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 86, Google 56, Facebook 46, Bing 7 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. **Batch-import fra CSV er skrøbelig.** `csvFileInput` validerer ikke kolonnerne, og brugeren får
   ingen feedback. Datagrunden er svag (ingen events) — tages kun hvis trafikken til batch viser sig.
2. **vCard-siden: skriv titel/beskrivelse og FAQ om til søgningerne.** GSC: 121 visninger, 0 klik,
   pos. 13 — "digitalt visitkort" pos. 9, "digitalt visitkort iphone" pos. 10. Accept: title nævner
   iPhone/Android, FAQ besvarer "digitalt visitkort til iPhone" + størrelse på fysisk kort (mm),
   DA+EN i samme commit. MÅL: CTR > 2 % pr. 2026-10-23.

Afkruttede opgaver (scan-kontrol, hvid zone, mm-download, EN-generator-først, share-billeder)
står i `docs/plan-arkiv.md`.

### GSC-CTR-baselines (måles igen pr. 2026-10-23)
- `/en/calendar-qr-code` 566v, 2 klik, CTR 0,4 %, pos. 11,0 — største enkelt-side uden for `/`.
- `/vcard-qr-kode` 121v, 0 klik, CTR 0,0 %, pos. 13,0 — opgave 2 nedenfor.
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
- **PDF i trykkvalitet til flere QR-typer / batch.** Eksporten findes for enkeltkoder; batch er kun ZIP
  med PNG/SVG. Accept: printklar PDF pr. kode i batch. Datagrund: virksomheder printer mange koder.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik — landet 2026-10-09 i
ceo/history-opt-in. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår.
(3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten
får opmærksomhed.

## Verificér deploy
- VERIFICÉR DEPLOY: en delt side viser preview-billede (og-image-*.png) på `/` og `/en/` · ceo/og-images · 2026-10-09 22:45
