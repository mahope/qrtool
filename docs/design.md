# Designsystem

QR Tool er et printværktøj. QR-arket er altid hvidt på en rolig bænk.
Layout og indhold styres af de enkelte sider; fælles udseende ligger i `style.css`.

| Token | Lys | Mørk |
| --- | --- | --- |
| `--bench` | #eef0f2 | #0e1013 |
| `--panel` | #ffffff | #171a1e |
| `--paper` | #ffffff | #ffffff |
| `--ink` | #0d0f12 | #f2f3f5 |
| `--ink-2` | #3b4048 | #c3c8cf |
| `--ink-3` | #565c65 | #9aa1ab |
| `--rule` | #c9ced4 | #2e343b |
| `--field-edge` | #6b717a | #7a818b |
| `--mark` / `--on-mark` | #ffe14d / #0d0f12 | samme |
| `--ok` | #17703f | #5fd08e |
| `--warn` | #7a4a00 | #f2b24c |
| `--err` | #b42318 | #ff9d94 |
| `--link` | #0b4fb3 | #8ab4ff |

Lys er standard. Uden gemt valg følger CSS styresystemet. Et gemt lyst eller
mørkt valg overstyrer det. Ældre variabelnavne er kun aliaser i `DEPRECATED`.

Schibsted Grotesk 400/600/700 er selvhostet under SIL OFL, se `fonts/OFL.txt`.
Den variable latinfil kommer fra Google Fonts' officielle distribution;
den dækker også æøå. Ingen font hentes eksternt ved brug af værktøjet.
Typeskala: 12/14/16/18/20/24/30/36/48 px. Brødtekst og felter: 16 px,
brødtekst med linjehøjde 1,55. H1: 36 px på mobil, 48 px fra 768 px,
linjehøjde 1,1, vægt 700, tracking -0,02em. Rene tal må bruge tabular-nums.

Mellemrum: 4/8-skalaen (4, 8, 12, 16, 24, 32, 48, 64, 96 px).
Radius: 4 px. Felter og sekundærknapper har 1 px `--field-edge`.
Primærknappen har `--ink` med `--panel`-tekst og mindst 48 px højde.
Klikmål: mindst 24 px, på touch mindst 44 px.
Fokus: `outline: 2px solid var(--ink); outline-offset: 2px`.

Valgt tilstand: 2 px blækkant, markergult fyld, `--on-mark`-tekst og flueben,
hvor der er plads. `--rule` er kun dekorativ. Gul og dekorative streger må
aldrig være en kontrols eneste grænse eller eneste signal.

Gør: brug tokens, tydelige labels over felter, tekst eller ikon ved status,
synlig fejl/succes/loading/tom/deaktiveret tilstand og AA-kontrast
(tekst 4,5:1, kontrolkanter og fokus 3:1). Hold bevægelse til transform/opacity
og respekter reduced-motion.
Gør ikke: gradienter, indigo, farvet glød, bløde kortskygger, eksterne fonte
eller farve alene som signal. QR-indhold forlader aldrig browseren.
