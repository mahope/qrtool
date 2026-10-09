# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- Gate: `npm test` = `npm run build` + `node --test` (78 tests). 78/78 grønne pr. 2026-10-09 15:10.
- 2026-10-09: Scan-kontrol landet (ceo/scan-check). Koden læses tilbage med jsQR efter hver
  generering, og brugeren ser "kan scannes" eller en konkret advarsel under QR-koden.
- 2026-10-09: Hvid zone landet (ceo/quiet-zone). Alle downloads har nu fire modulers lys kant.
- DEPLOY OK 2026-10-09 (verificeret på indhold): cache-bust med indholds-hash, UTF-8 i
  payloads, kalenderdato, vCard-escaping, vCard/kalender-undersider, WiFi-guide,
  generator-først på forsiden, historik som tilvalg.
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
2. ✅ **Hvid zone om koden i downloads.** Landet i ceo/quiet-zone (2026-10-09): fire modulers
   lys kant i preview, download, batch, print, kopi og del.
3. **Størrelse i millimeter til print.** Hvorfor: brugeren vælger pixels, men skal trykke 3 cm.
   Accept: indtast mm (fx 20/30/50) og få PNG ved 300 dpi plus PDF i den fysiske størrelsen.
   Datagrund: PDF-eksport findes allerede og benyttes; `/` 151 besøgende, 90 % bounce.
4. **Engelsk forside: generatoren først.** Hvorfor: `/en/` har 9 besøgende og 100 % bounce.
   Accept: samme rækkefølge som den danske forside, og en test der stiller rækkefølgen samme
   krav på begge sprog. Datagrund: `/en/` 9 besøgende, bounce 100 %.
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
- **Fysisk printstørrelse (mm) med 300 dpi.** Til: erhverv, der sætter koder i tryksager.
  Skal flytte andelen downloads til print. Accept: PDF og PNG i valgt mm. Datagrund: `/` 151 besøgende.
- **App-store-link som QR-type.** Til: udviklere og små apps. Skal flytte antal genererede koder.
  Accept: koder til App Store og Google Play fra én URL. Datagrund: konkurrenter tilbyder typen.
- **Kontrastmåling i farvevælgeren.** Til: alle der vælger farver. Delvist dækket af scan-kontrollen;
  resten er en advarsel før generering. Accept: vise kontrastforholdet mellem kode og baggrund.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik — landet 2026-10-09 i
ceo/history-opt-in. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår.
(3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten
får opmærksomhed.

## Verificér deploy
- VERIFICÉR DEPLOY: scan-kontrollen vises under QR-koden efter generering (DA+EN) · ceo/scan-check · 2026-10-09 14:10
- VERIFICÉR DEPLOY: hvid zone om koden i preview, PNG/JPG/SVG/PDF og batch-ZIP (DA+EN) · ceo/quiet-zone · 2026-10-09 15:10
- VERIFICÉR DEPLOY: app.js og style.css i dist er bygget med esbuild 0.28.1 (samlet med hvid zone) · deps/esbuild-0.28.1 · 2026-10-09 15:25
