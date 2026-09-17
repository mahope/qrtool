# SVG i ZIP-eksport — afgrænset P1-test

Dato: 17. september 2026.

Dette er ét afsluttet, lokalt testtrin af backlog-opgaven »Gennemfør en afgrænset scan- og eksporttest«. Den samlede P1-opgave er ikke afsluttet. Produktionskode og salgstilbud er ikke ændret.

## Resultat

`node --test batch-export.test.js` gav **7 beståede tests, 0 fejl, 0 oversprungne** på cirka 14 sekunder med de allerede installerede afhængigheder.

Testen kører den eksisterende `toSvgString`-funktion og batch-handler fra `app.js` i en Node-VM. Kontroller, DOM, oversættelser og downloadfunktionen er erstattet med testobjekter. QR-generator, JSZip og jsQR er de faktiske biblioteker fra `lib/`. Dette er ikke en browser- eller ende-til-ende-test.

Verificeret:

- Tre inputlinjer giver én ZIP-blob med præcis `qr-1.svg`, `qr-2.svg` og `qr-3.svg`. Arkivet genindlæses med CRC32-kontrol.
- Kvadratiske SVG-modulers koordinater rekonstrueres som sorte pixels på hvid baggrund og dekodes med jsQR. URL, en på forhånd escaped WiFi-streng med specialtegn og vCard-lignende tekst bevares præcist. Sidstnævnte indeholder bogstavelige `\n`, ikke linjeskift, og verificerer **ikke** et gyldigt vCard eller kontaktimport. WiFi-testen verificerer ikke formularens escaping eller forbindelse til et netværk.
- Et separat batch med 100 tekstlinjer giver 100 arkivposter. Første og sidste SVG dekoder korrekt; de mellemliggende 98 afkodes ikke.
- Tomt input, 101 linjer og manglende JSZip afvises uden kald til downloadfunktionen.
- En simuleret ZIP-fejl gendanner knappen uden succesbesked.
- Begge sprogversioner refererer til `/lib/jszip.min.js` før `app.js`.

JSZip 3.10.1 ligger i `lib/jszip.min.js`; det forklarer, hvorfor ZIP kan være implementeret uden en JSZip-post i npm-dependencies. Ved kodelæsning ses `lib` i byggescriptets kopiliste. Testens kontrol af denne streng er kun en simpel konfigurationskontrol, ikke bevis på et færdigt build.

## Kontroller og begrænsninger

`npm run build` nåede minificering af CSS, app.js og service worker, men blev afbrudt efter 100 sekunder under minificering af QR-biblioteket. Et isoleret minificeringsforsøg uden `npx` gav heller intet resultat inden 25 sekunder. Også en efterfølgende Git-statuskommando ramte timeout; årsagen er ikke fastslået. Det fulde build er **ikke verificeret**.

`package.json` har kun en placeholder som `npm test` og ingen lint- eller typecheck-kommando. Den selvstændige test ovenfor er den meningsfulde testkontrol. Der er ikke tilføjet pakker eller ændret build-konfiguration.

Testen verificerer ikke XML-validitet, faktisk SVG-rendering, farver, transparens, rundede moduler, prikker, browserinitialisering, download til disk eller netværkstrafik. Downloadfunktionen opsamler blot blobben i hukommelsen. Kildeudsnittene findes via markører; ændres disse, skal testens udtræk vedligeholdes.

## Resterende del af P1-opgaven

- URL, WiFi med specialtegn og gyldigt vCard på fysiske iPhone- og Android-enheder.
- PNG, SVG og øvrige tilbudte eksportformater i en rigtig browser, inklusive ZIP-download til disk.
- Scanning af et fysisk A5/A4-skilt med relevante printindstillinger.
- Kontrol af netværkstrafik før eventuelle privatlivsløfter.

Ingen brugerrettede løfter er fjernet eller udvidet på baggrund af denne begrænsede test. Resultatet er ikke en godkendelse af printklarhed eller alle eksportformater.

## Gentag testen

```bash
node --test batch-export.test.js
```

Testen bruger Node-moduler og eksisterende lokale biblioteker, ingen nye afhængigheder. Ingen push, deploy eller mails er udført.
