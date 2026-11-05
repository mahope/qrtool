# Kvalitetsjobbet i CI (axe, vandret overløb og Lighthouse)

Workflowen `.forgejo/workflows/quality.yml` kører på pull requests (og manuelt) i en egen fil, så et rødt budget ikke blokerer de almindelige tests i `ci.yml`. Den bygger `dist/`, serverer den lokalt med samme routing og gzip som nginx og kører tre målinger. Lokalt: `npm run build && npm run quality` (kræver Chrome; sæt `QUALITY_CHROME` til stien, hvis Playwright ikke selv finder en).

## Hvad der måles

| Måling | Sider | Budget |
|---|---|---|
| axe (WCAG 2.2 AA og best practice), 390 og 1440 px, standardtema og skiftet tema | 9 sider, se `scripts/quality/axe.mjs` | 0 fund med alvorlighed critical eller serious |
| Vandret overløb ved 320 og 390 px (`scrollWidth` mod vinduets bredde) | alle sider i `sitemap.xml` plus 404 | 0 px |
| Lighthouse mobil (én kørsel pr. side) | `/`, `/wifi-qr-kode`, `/scan-qr-kode`, `/guides/qr-koder-til-restauranter` | CLS højst 0,02, tilgængelighed mindst 95, JavaScript overført højst 80 KB på forsiden |

Budgetterne ligger i `scripts/quality/budgets.json`, og logikken i `scripts/quality/budgets.mjs` har enhedstests i `test/quality-budgets.test.js`.

## Udgangspunkt (første kørsel)

Første kørsel var på denne gren, som indholdsmæssigt er `master` (ingen sideændringer), 5/11-2026 på agent-worker. Den viste, at `master` allerede overskrider flere af de givne budgetter. For at jobbet kan være grønt i dag og alligevel fange regressioner, står de målte værdier i `known` i `budgets.json` som udgangspunkt, der ikke må blive værre. Alt, der ikke står dér, skal opfylde det rigtige budget.

- **CLS:** 0,000 på alle fire sider. Budgettet 0,02 gælder uden undtagelse.
- **Lighthouse tilgængelighed:** `/` 84, `/wifi-qr-kode` 91, `/scan-qr-kode` 89, restaurantguiden 92 (budget 95). Udgangspunktet er scoren pr. side.
- **JavaScript overført på forsiden:** 123.403 byte (120,5 KB) mod budgettet 80 KB. Udgangspunktet er sat til 125.000 byte. De andre sider er under 80 KB.
- **Vandret overløb:** ved 320 px forsiden 95 px, `/en/` 95 px, `/vcard-qr-kode` 77 px, `/en/vcard-qr-code` 83 px, `/kalender-qr-kode` og `/en/calendar-qr-code` 16 px. Ved 390 px forsiden og `/en/` 49 px, `/vcard-qr-kode` 7 px og `/en/vcard-qr-code` 13 px. Alle andre sider har 0 px.
- **axe, critical og serious, samlet antal noder over alle sider, bredder og temaer (34 scanninger):** color-contrast 354, label-content-name-mismatch 40, link-name 24, select-name 16, label 8, role-img-alt 8, link-in-text-block 2.

Tallene er stabile: tre kørsler i træk gav de samme axe-tal efter at overgange og animationer er slået fra under målingen (uden det svingede color-contrast mellem 354 og 376).

## Når en side bliver bedre

Når en ændring retter noget af ovenstående, skal den samme pull request sænke tallet i `known` (eller fjerne posten, når budgettet er nået). Ellers kan en senere regression op til det gamle tal slippe igennem. Jobbet kræver ikke, at tallet sænkes, men det er hele pointen med udgangspunktet.

## Dokumentation af at budgetterne kan fejle

Lokalt dry-run 5/11-2026: en `<div style="width:600px">` og en blok, der indsættes 200 ms efter indlæsning, blev lagt midlertidigt på `wifi-qr-kode.html` og bygget. Jobbet gav exit 1 med disse fund, og filen blev derefter rullet tilbage:

- `/wifi-qr-kode`: 292 px vandret overløb ved 320 px og 222 px ved 390 px
- `/wifi-qr-kode`: CLS 0,353 mod budgettet 0,02

Uden bruddet gav samme kørsel exit 0 ("All quality budgets met"). De rene budgetfunktioner testes desuden i `test/quality-budgets.test.js`.

## Kørselstid

Lokalt på agent-worker (belastet af andre job): 108 til 177 sekunder for hele sekvensen (axe og overløb sammen ca. 55 til 70 s, Lighthouse ca. 50 til 80 s). Workflowen har `timeout-minutes: 6`. Selve Forgejo-runneren er ikke afprøvet endnu, så tiden dér inklusive `npm ci` er ikke målt.

## Chrome

Workflowens trin "Locate Chrome" leder efter `google-chrome`, `google-chrome-stable`, `chromium` og `chromium-browser`, skriver sti og version i loggen og sætter `QUALITY_CHROME`. Findes ingen, fejler jobbet med en tydelig besked. Hvilken sti runneren bruger, står i første kørsels log. Som root starter Lighthouse Chrome med `--no-sandbox`; på agent-worker, hvor scriptet ikke kører som root, bruges sandbox.

## Afhængigheder

Tre nye devDependencies, alle fastlåste: `playwright` 1.64.1 (udgivet 14/10-2026), `@axe-core/playwright` 4.14.0 (15/10-2026) og `lighthouse` 13.6.0 (27/10-2026). De er installeret med `--ignore-scripts`; Playwrights browsere hentes ikke, fordi jobbet bruger den Chrome, der allerede er på runneren.
