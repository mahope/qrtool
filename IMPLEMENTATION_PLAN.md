# IMPLEMENTATION_PLAN — qrtool.dk

STATUS:
- Gate: `npm test` = `npm run build` + `node --test` (42 tests: QR-strenge, round-trip gennem jsQR, site-integritet). 42/42 grønne.
- 2026-10-09: gate bygget (ceo/quality-gate). `npm test` var en no-op før.
- 2026-10-09: `bevaret/2026-10-auto-union-night` vurderet — 3 commits: (1) opt-in-historik, (2) 30-dages stopregel (kun BACKLOG-tekst, ingen kode), (3) ZIP-SVG-tjek (test-fil, ingen produktkode). Ingen landet endnu.
- ❓ Search Console mangler for qrtool.dk. Ingen GSC-tilgang i snapshot-jobbet, så der bygges ikke på gæt om søgeord.
- PR-TJEK: 2026-10-09 — ingen åbne PR'er.
- BRANCH-TJEK: 2026-10-09 — kun master + bevaret/*, intet at rydde.

## Fase 3 — trafik-drevet

Baseline (Plausible, 28 dage til 2026-10-08): 206 besøgende, 288 sidevisninger, bounce 90 %, besøgstid 42 s.
- `/` 150 besøgende (+90 %), bounce 90 % — MÅL: `/` bounce < 75 % pr. 2026-11-05
- `/wifi-qr-kode` 9, `/vcard-qr-kode` 6, `/sms-qr-kode` 7, `/kalender-qr-kode` 6 (+500 %), `/tekst-qr-kode` 3
- `/en/calendar-qr-code` 11, `/en/email-qr-code` 10, `/en/` 9 (bounce 100 %)
- Kilder: Direct 89, Google 54, Facebook 46, Bing 6 — Facebook er 36 % af al trafik.

### Åbne opgaver

1. **Generatoren først på forsiden.** Datagrund: 90 % af de 150 besøgende på `/` forlader siden uden at bruge værktøjet; Facebook sender næsten lige så meget som Google (46 mod 54), og delte links rammer toppen af siden. Gør tekst/URL-generatoren synlig over folden med et synligt resultat og en downloadknap uden scroll på mobil (390 px). Accept: ved 390 px er inputfelt, QR-resultat og download synlige uden at scrolle.
2. **Ret dato i kalender-QR.** Datagrund: `formatDate` bruger `date.toISOString()` på en lokal midnat, så en begivenhed kl. 00:00 i dansk tid flytter til dagen før i QR-koden. Accept: DTSTART/DTEND bærer den dato brugeren indtastede (test findes allerede, kør den rød først).
3. **Escape vCard-tekst.** Datagrund: `;`, `,`, `\` og `:` i ORG/TITLE/FN/ADR bryder vCard-strukturen, og det er almindelige tegn i danske virksomhedsnavn ("Larsen & Sønner A/S"). Accept: specialtegn escapes, og kortet afkodes korrekt.
4. **Undersider med substans.** Datagrund: `/wifi-qr-kode` 9, `/vcard-qr-kode` 6, `/kalender-qr-kode` 6 (+500 %) med bounce 100 %. Tilføj konkret vejledning ("sådan scanner gæster dit WiFi på iPhone og Android"), FAQ og FAQPage/HowTo-strukturerede data. Accept: mindst én HOWTO-sekvens og tre FAQ-spørgsmål pr. side, markeret med JSON-LD.
5. **Land QR-historik som tilvalg.** Datagrund: privatlivspolitikken siger "vi gemmer ikke dine indtastninger", men koden gemmer QR-indhold (WiFi-koder, kontaktdata) i localStorage uden sporger. Accept: historik er slået fra som standard med en synlig forklaring, og teksten i politikken og om-siden passer med koden.
6. **Batch-import fra CSV er skrøbelig.** Datagrund: `csvFileInput` accepterer filer uden validering, og brugerne får ingen feedback hvis kolonnerne ikke matcher. Datagrunden er svag (ingen events) — behandles først hvis GSC viser trafik til batch.

### Feature-kø
- **Printklar eksport (PDF/PNG i 300 dpi).** Til: erhverv, der sætter QR-koder i tryksager. Skal flytte andelen mobildownloads. Accept: PDF med korrekt størrelse i mm. Datagrund: `/` 150 besøgende, 90 % bounce.
- **Kontrastadvarsel ved farvevalg.** Til: alle, der laver koder med mørke farver. Accept: koder under 40 % kontrast til mørk mod lys advares. Datagrund: farvetilpasning er nævnt som kernefeature.
- **MobilePay-betalingslink.** Til: foreninger og små forhandlere. Datagrund: `/sms-qr-kode` 7 besøgende (+75 %) viser efterspørgsel på danske formater.

## Bevaret arbejde
`bevaret/2026-10-auto-union-night` (slet aldrig): (1) opt-in-historik i app.js + politik-tekst — stadig rigtigt, opgave 6. (2) "30-dages stopregel" — kun BACKLOG-tekst, ingen kode; udgår. (3) ZIP-SVG-verificering — kun en testfil, ingen produktændring; tages igen når batch-eksporten får opmærksomhed.

## Verificér deploy
Ingen åbne noter.
