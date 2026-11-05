# Kvalitetsjobbet i CI (axe, vandret overløb og Lighthouse)

Workflowen `.forgejo/workflows/quality.yml` kører på pull requests (og manuelt) i en egen fil, så et rødt budget ikke blokerer de almindelige tests i `ci.yml`. Den bygger `dist/`, serverer den lokalt med samme routing og gzip som nginx og kører tre målinger. Lokalt: `npm run build && npm run quality` (kræver Chrome; sæt `QUALITY_CHROME` til stien, hvis Playwright ikke selv finder en).

## Hvad der måles

| Måling | Sider | Budget |
|---|---|---|
| axe (WCAG 2.2 AA og best practice), 390 og 1440 px, standardtema og skiftet tema | 9 sider, se `scripts/quality/axe.mjs` | 0 fund med alvorlighed critical eller serious |
| Vandret overløb ved 320 og 390 px (`scrollWidth` mod vinduets bredde) | alle sider i `sitemap.xml` plus 404 | 0 px |
| Lighthouse mobil (én kørsel pr. side) | `/`, `/wifi-qr-kode`, `/scan-qr-kode`, `/guides/qr-koder-til-restauranter` | CLS højst 0,02, tilgængelighed mindst 95, JavaScript overført højst 80 KB på forsiden |

Budgetterne ligger i `scripts/quality/budgets.json`, og logikken i `scripts/quality/budgets.mjs` har enhedstests i `test/quality-budgets.test.js`.

## Udgangspunkt

Første kørsel (5/11-2026, på `master` før designsystemet) viste, at `master` overskred flere budgetter: tilgængelighed 84 til 92 mod 95, vandret overløb op til 95 px ved 320 px og 354 axe-noder med color-contrast. De målte værdier stod dengang i `known` i `budgets.json` som udgangspunkt, der ikke måtte blive værre.

Efter at designsystemet (#17) og rettelserne #43 til #45 er landet, er næsten alt rettet, og `known` er strammet til det, der stadig mangler:

- **JavaScript overført på forsiden:** 123,8 KB mod budgettet 80 KB. Udgangspunktet er 127.000 byte (må ikke vokse; målt 126.8 KB); de andre sider er under 80 KB.
- **Alt andet opfylder de rigtige budgetter:** Lighthouse tilgængelighed 100 på alle fire sider (budget 95), CLS 0,000 til 0,011 (budget 0,02), 0 px vandret overløb ved 320 og 390 px og 0 critical/serious axe-fund på de 9 sider.

`known` kan nu kun indeholde undtagelser; er en værdi blevet bedre, skal undtagelsen fjernes, så den ikke kan glide tilbage.

Tallene er stabile: tre kørsler i træk gav de samme axe-tal efter at overgange og animationer er slået fra under målingen (uden det svingede color-contrast mellem 354 og 376).

## Når en side bliver bedre

Når en ændring retter noget af ovenstående, skal den samme pull request sænke tallet i `known` (eller fjerne posten, når budgettet er nået). Ellers kan en senere regression op til det gamle tal slippe igennem. For axe gælder det tallet for netop den side og regel. Jobbet kræver ikke, at tallet sænkes, men det er hele pointen med udgangspunktet.

## Dokumentation af at budgetterne kan fejle

Lokalt dry-run 5/11-2026: en `<div style="width:600px">` og en blok, der indsættes 200 ms efter indlæsning, blev lagt midlertidigt på `wifi-qr-kode.html` og bygget. Jobbet gav exit 1 med disse fund, og filen blev derefter rullet tilbage:

- `/wifi-qr-kode`: 292 px vandret overløb ved 320 px og 222 px ved 390 px
- `/wifi-qr-kode`: CLS 0,353 mod budgettet 0,02

Uden bruddet gav samme kørsel exit 0 ("All quality budgets met"). De rene budgetfunktioner testes desuden i `test/quality-budgets.test.js`. Bemærk: for tilgængelighed og JavaScript på forsiden er bruddet kun påvist i enhedstest (budgetfunktionerne), ikke ved at forringe en rigtig side. Det samme gælder at overløb og CLS kun er påvist på `/wifi-qr-kode`.

## Kørselstid

Lokalt på agent-worker (belastet af andre job): 108 til 177 sekunder for hele sekvensen (axe og overløb sammen ca. 55 til 70 s, Lighthouse ca. 50 til 80 s). Workflowen har `timeout-minutes: 6`. Selve Forgejo-runneren er ikke afprøvet endnu, så tiden dér inklusive `npm ci` er ikke målt.

## Chrome

Workflowens trin "Locate Chrome" leder efter `google-chrome`, `google-chrome-stable`, `chromium` og `chromium-browser`, skriver sti og version i loggen og sætter `QUALITY_CHROME`. Findes ingen, fejler jobbet med en tydelig besked. Hvilken sti runneren bruger, står i første kørsels log. Stien er ikke verificeret på Forgejo-runneren: første kørsel skal tjekkes, før jobbet gøres til et krav i branch protection. Som root starter Lighthouse Chrome med `--no-sandbox`; på agent-worker, hvor scriptet ikke kører som root, bruges sandbox.

## Kendte bivirkninger

- **Dockerfile:** produktions-imaget bygger på `node:20-alpine` med `npm ci --production=false`, så de nye devDependencies (142 pakker) installeres ved hver Dokploy-deploy. `lighthouse` og `@axe-core/playwright` kræver Node 22 eller nyere, så npm skriver EBADENGINE-advarsler på Node 20 (buildet fejler kun med `engine-strict`), og buildet bliver langsommere. Dockerfilen er ikke ændret i dette job. Før merge til `master` bør det aftales separat, om basen skal op på Node 24, eller om byggetrinnet skal undgå dev-pakkerne.
- **`engines.node`:** `package.json` siger stadig `>=14.0.0`, men de nye devDependencies kræver Node 22.19 eller nyere. Kvalitetsjobbet kører på Node 24 i workflowen. `engines` er bevidst ikke hævet, fordi det ville ramme Docker-bygget ovenfor.

## Afhængigheder

Tre nye devDependencies, alle fastlåste: `playwright` 1.64.1 (udgivet 14/10-2026), `@axe-core/playwright` 4.14.0 (15/10-2026) og `lighthouse` 13.6.0 (27/10-2026). De er installeret med `--ignore-scripts`; Playwrights browsere hentes ikke, fordi jobbet bruger den Chrome, der allerede er på runneren.
