# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- Gate: `npm test` = `npm run build` + `node --test` (109 tests). 109/109 grønne pr. 2026-10-09 20:20.
- 2026-10-09: App-store-link som QR-type landet (ceo/app-link): ny "App"-fane der bygger
  App Store- og Google Play-links fra et ID eller et indsat link, med live forhåndsvisning. DA+EN.
- DEPLOY OK 2026-10-09 (verificeret på indhold på `/` og `/en/`): printstørrelse + 300 dpi/PDF,
  scan-kontrol, hvid zone, cache-bust, generator-først, vCard/kalender-undersider, historik som tilvalg.
- MÅL: `/` baseline 151 besøgende/28 d, bounce 90 % → under 75 % pr. 2026-11-05.
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

1. ✅ **Scan-kontrol af den færdige kode.** Landet i ceo/scan-check (2026-10-09).
2. ✅ **Hvid zone om koden i downloads.** Landet i ceo/quiet-zone (2026-10-09).
3. ✅ **Størrelse i millimeter til print.** Landet i ceo/print-size-mm (2026-10-09).
4. ✅ **Engelsk forside: generatoren først.** Var allerede opfyldt: rækkefølgen er identisk på
   `index.html` og `en/index.html`, og `test/site.test.js` ("homepage: the generator card comes
   before…") håndhæver den på begge sprog. Ingen kodeændring nødvendig.
5. **Batch-import fra CSV er skrøbelig.** `csvFileInput` validerer ikke kolonnerne, og brugeren får
   ingen feedback. Datagrunden er svag (ingen events) — tages kun hvis trafikken til batch viser sig.

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
- VERIFICÉR DEPLOY: "App"-fanen og appPreviewUrl vises på `/` og `/en/` (DA+EN) · ceo/app-link · 2026-10-09 18:15
- VERIFICÉR DEPLOY: kontrast-linjen "Kontrast: 21,0:1 — stærk kontrast" vises under farvevælgeren på `/` og `/en/` · ceo/contrast-readout · 2026-10-09 20:20
