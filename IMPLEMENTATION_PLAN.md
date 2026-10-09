# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- Gate: `npm test` = `npm run build` + `node --test` (60 tests). 60/60 grønne pr. 2026-10-09 09:00.
- 2026-10-09: Cloudflare/nginx serverede gammel `app.js` i op til 7 dage. `nginx.conf` giver `.js`/`.css` `max-age=604800`, Cloudflare cacher pr. fuld URL, og HTML'ens hardkodede `?v=8` blev aldrig bumpet ved deploy. Origin havde dagens rettelser, men brugerne fik den gamle fil. Rettet i ceo/cache-bust-assets: buildet stempler et indholds-hash på `?v=` i alle HTML-filer og i `sw.js` (`?v=` + `CACHE_NAME`).
- DEPLOY OK 2026-10-09: wifi-scan-guide (live side = lokal, ny sektion findes) og home-generator-first (live forside = lokal, rækkefølge input→preview→options).
- 2026-10-09: vCard- og kalender-siderne (DA+EN) fik HowTo- og FAQPage-data plus en praktisk modtager-guide, som WiFi-siden. ceo/vcard-kalender-substans.
- qr-encoding, calendar-date og escape-vcard ligger på origin, men nåede ikke brugerne pga. cachen. De bør være synlige efter næste batch-vindue (12:30), nu hvor cache-busting er på plads.
- ❓ Search Console mangler for qrtool.dk. Ingen GSC-tilgang i snapshot-jobbet, så der bygges ikke på gæt om søgeord.
- PR-TJEK: 2026-10-09 — ingen åbne PR'er. Ingen GitHub Actions i repoet; den lokale gate er eneste kontrol.
- BRANCH-TJEK: 2026-10-09 — kun master + bevaret/*, intet at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 289 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 151 besøgende (+94 %), bounce 90 % — MÅL: `/` bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 10, `/vcard-qr-kode` 6, `/sms-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 86, Google 56, Facebook 46, Bing 7 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. **Land QR-historik som tilvalg.** Datagrund: privatlivspolitikken siger "vi gemmer ikke dine indtastninger", men koden gemmer QR-indhold (WiFi-koder, kontaktdata) i localStorage uden spørgsmål. Accept: historik er slået fra som standard med en synlig forklaring, og teksten i politikken og om-siden passer med koden. Dækker bevaret-arbejdet (1).
2. **Batch-import fra CSV er skrøbelig.** Datagrund: `csvFileInput` accepterer filer uden validering, og brugerne får ingen feedback hvis kolonnerne ikke matcher. Datagrunden er svag (ingen events) — behandles først hvis GSC viser trafik til batch.

### ❓ Til Mads
- **Playwright mangler.** Der er ingen skærmbillede-verifikation af UI-ændringer, kun HTML-gate. En devDependency på `@playwright/test` + axe ville give billeder ved 390/1280 px og en a11y-scanning. Uden tilladelse til nye npm-pakker gør loopet UI-ændringer uden at se dem i browseren.
- **Search Console mangler for qrtool.dk** (se STATUS). Ingen GSC-tal, så der bygges ikke på gæt om søgeord.

### Feature-kø
- **Printklar eksport (PDF/PNG i 300 dpi).** Til: erhverv, der sætter QR-koder i tryksager. Skal flytte andelen mobildownloads. Accept: PDF med korrekt størrelse i mm. Datagrund: `/` 151 besøgende, 90 % bounce.
- **Kontrastadvarsel ved farvevalg.** Til: alle, der laver koder med mørke farver. Accept: koder under 40 % kontrast til mørk mod lys advares. Datagrund: farvetilpasning er nævnt som kernefeature.
- **MobilePay-betalingslink.** Til: foreninger og små forhandlere. Datagrund: `/sms-qr-kode` 6 besøgende viser efterspørgsel på danske formater.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik i app.js + politik-tekst — stadig rigtigt, opgave 2. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår. (3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten får opmærksomhed.

## Verificér deploy
- DEPLOY OK 2026-10-09: WiFi-siden forklarer hvordan gæster scanner koden på iPhone og Android · ceo/wifi-scan-guide
- DEPLOY OK 2026-10-09: forsiden viser generatoren først på mobil, previewen lå før folden · ceo/home-generator-first
- VERIFICÉR DEPLOY: vCard- og kalender-siderne har HowTo + FAQPage og en praktisk modtager-guide (DA+EN) · ceo/vcard-kalender-substans · 2026-10-09 10:15
- VERIFICÉR DEPLOY: `?v=`-tokenet er et indholds-hash, så ny app.js/style.css ikke serveres fra Cloudflare-cachen · ceo/cache-bust-assets · 2026-10-09 09:00
- VERIFICÉR DEPLOY: `æøå` i QR-koder gemmes som UTF-8 · ceo/qr-encoding · 2026-10-09 01:28 (cache-blokeret indtil cache-busting er live)
- VERIFICÉR DEPLOY: kalender-QR bærer den indtastede dato (midnat flyttede til dagen før) · ceo/calendar-date · 2026-10-09 01:28 (samme)
- VERIFICÉR DEPLOY: vCard-tegn som ; , \ og : escapes korrekt i FN, ORG, TITLE og ADR · ceo/escape-vcard · 2026-10-09 07:50 (samme)
