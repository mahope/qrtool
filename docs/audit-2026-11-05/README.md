# Audit af qrtool.dk, 5/11-2026

Skærmbilleder, målinger og scripts bag issuesene, der blev oprettet efter gennemgangen 5/11-2026. Ingen PR hører til denne gren; den er kun dokumentation.

## Hvad er målt

- **Live** (`https://qrtool.dk`, 5/11-2026): alle 31 sider fra sitemap og 404, ved 320, 360, 390, 430, 768, 1024 og 1440 px samt mobil i landskab (844 x 390 og 667 x 375).
- **Efter igangværende PR'er** (`after-inflight` i filnavne): et lokalt bygget udkast af `master` med de endnu ikke merget grene `issue/14`, `issue/17`, `issue/13`, `issue/15`, `issue/18` og `issue/5` (de fire juridiske sider i `issue/5` er flettet med `-X ours`). Det er et måleudkast, ikke noget der er udgivet. Formålet er at se, hvad der stadig er galt, når de planlagte designissues er landet.
- Lighthouse 13.6.0, median af 3 kørsler pr. side og formfaktor (mobil og desktop), kørt på agent-worker mens maskinen var belastet af andre job (load 7 til 17 på 16 kerner). Tallene er vejledende; tilgængelighedsfund og bytevægt påvirkes ikke af belastningen.
- axe-core 4.14.0 via `@axe-core/playwright` 4.14.0, ved 390 og 1440 px, standardtema og skiftet tema.
- Layoutmåling med Playwright 1.64.1 (Chromium). Bredden måles som `document.documentElement.scrollWidth` mod vinduets bredde i en ikke-mobil kontekst med præcis den bredde, så overløb ikke skjules. En rigtig telefon udvider i stedet layoutviewporten til indholdets bredde (side skrumper ind og kan panoreres); den udvidede bredde er målt separat (`mobilefit`) og står i issuene.

## Mapper

- `img/`: de skærmbilleder issuene linker til.
- `data/`: `overflow-matrix-*.tsv` (side x bredde, pixels vandret overløb), Lighthouse-medianer, axe-resultater, offline- og ydelsesmålinger.
- `scripts/`: de scripts, målingerne er lavet med. De kører på agent-worker fra `~/dev/data/audit-2026-11-05/tools` (der ligger `node_modules` med fastlåste versioner: playwright 1.64.1, lighthouse 13.6.0, @axe-core/playwright 4.14.0). Eksempler: `node responsive-audit.mjs sweep <udmappe>` (kræver en `urls.txt` i udmappen), `QR_BASE=http://127.0.0.1:8091 node axe-audit.mjs <fil.json>`.

## Begrænsninger

- Ingen rigtige iPhones eller Android-telefoner: iOS-tastatur- og zoomadfærd er udledt af koden, ikke målt på en enhed.
- Tap-mål er målt på elementets egen boks. Et afkrydsningsfelt med en label, der kan klikkes, har i praksis et større mål end boksen.
- Ydelsestal med 4x CPU-nedsættelse er Chromes emulation, ikke en rigtig telefon.
