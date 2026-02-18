# Product Backlog — QR Tool (qrtool.dk)

## Prioritering: P0 Kritisk | P1 Høj | P2 Medium | P3 Lav

---

## SEO & Synlighed (1–12)

### #1 — Dedikerede landingssider for alle QR-typer (P0)
Der findes kun `/wifi-qr-kode`. Opret tilsvarende sider for `/vcard-qr-kode`, `/email-qr-kode`, `/sms-qr-kode`, `/kalender-qr-kode` og `/tekst-qr-kode` med unik SEO-indhold, FAQ og schema markup. Øger organisk trafik markant.

- [x] Færdig — alle 5 landingssider oprettet med SEO, schema, FAQ og QR-generering

### #2 — Blog/guide-sektion (P1)
Opret `/guides` med artikler som "Sådan bruger du QR-koder i din restaurant", "QR-koder til events", "Visitkort med QR-kode". Drevet af statiske HTML-filer. Giver long-tail keyword-trafik.

- [x] Færdig — 3 guides (restauranter, events, visitkort) + indeksside med schema markup

### #3 — Hreflang-tags og engelsk version (P1)
Tilføj `hreflang="da"` på alle sider og forbered en `/en/` version. Danmark har mange engelsktalende brugere og turister. Dobler potentiel trafik.

- [ ] Ikke startet

### #4 — Struktureret data for HowTo-schema (P2)
Tilføj `HowTo` schema markup til guide-sektionerne, så Google kan vise step-by-step rich snippets i søgeresultaterne.

- [x] Færdig — HowTo JSON-LD schema med 5 trin på hovedsiden

### #5 — Forbedret intern linking-struktur (P2)
Tilføj kontekstuelle links mellem landingssider, guides og hovedsiden. Forbedrer crawlability og fordeler link juice.

- [x] Færdig — kontekstuelle links i SEO-indhold til alle landingssider og guides, footer med alle QR-typer

### #6 — Meta description A/B-optimering (P2)
Omskriv meta descriptions til at være mere action-orienterede med CTA ("Lav din gratis QR-kode på 10 sekunder"). Øg CTR fra søgeresultater.

- [x] Færdig — action-orienterede meta descriptions med CTA på hovedsiden

### #7 — Open Graph-billeder pr. QR-type (P2)
Unikke OG-billeder for hver landingsside (WiFi-ikon, vCard-ikon, osv.) i stedet for et generisk billede. Bedre synlighed på sociale medier.

- [ ] Ikke startet

### #8 — Breadcrumb-navigation (P3)
Tilføj visuel breadcrumb på undersider (`Hjem > WiFi QR-kode`) med tilhørende `BreadcrumbList` schema.

- [x] Færdig — BreadcrumbList JSON-LD schema tilføjet på alle 11 undersider

### #9 — Sitemap udvidelse (P3)
Udvid sitemap.xml med alle nye landingssider, guides og billeder (`<image:image>`-tags). Tilføj `lastmod`-datoer.

- [x] Færdig — image:image namespace, billedtags for alle QR-typer, opdaterede lastmod-datoer

### #10 — Core Web Vitals optimering (P1)
Minificer CSS/JS, tilføj critical CSS inline, lazy-load below-fold indhold. Mål og optimer LCP, FID og CLS.

- [x] Færdig — inline critical CSS, content-visibility lazy rendering, fetchpriority, defer non-critical scripts

### #11 — Tilføj JSON-LD for Organization (P3)
Tilføj `Organization` schema med logo, social profiles og kontaktinfo til footer/alle sider.

- [x] Færdig — Organization JSON-LD med logo, founder og sameAs på hovedsiden

### #12 — Canonical URL-audit (P3)
Sikr at alle sider har korrekte canonical URLs, og at der ikke er duplicate content mellem .html og clean URL-versioner.

- [x] Færdig — canonical tags tilføjet til privatlivspolitik og cookiepolitik, 404 har noindex

---

## UI/UX Forbedringer (13–28)

### #13 — Onboarding/tooltip-flow for nye brugere (P1)
Vis korte, diskrete tooltips ved første besøg der guider brugeren: "Vælg type → Udfyld → Download". Kan dismisses permanent.

- [x] Færdig — 3-trins tooltip-tour med keyboard support og localStorage dismiss

### #14 — Drag-and-drop logo-upload (P1)
Erstat standard file-input med en drag-and-drop zone til logo-upload. Vis preview af logo i QR-koden med mulighed for at justere størrelse og position.

- [x] Færdig — drag-and-drop zone med preview, size slider, auto-høj fejlkorrektion

### #15 — Kopiér QR-kode til clipboard (P0)
Tilføj en "Kopiér" knap ved siden af download, der kopierer QR-koden direkte til clipboard som billede. Meget efterspurgt feature.

- [x] Færdig (b672e36)

### #16 — Toast/notification-system (P1)
Erstat den nuværende success-feedback (grøn knap-farve) med et dedikeret toast-system der viser "QR-kode genereret!", "Kopieret til clipboard!", "Downloadet!" osv.

- [x] Færdig — toast-system med success/error/info typer, erstatter alle alert() kald

### #17 — Forbedret farve-picker med presets (P2)
Tilføj preset farveskemaer (f.eks. "Professionel blå", "Energisk rød", "Naturlig grøn") udover den frie farvevælger. Gør det nemmere for ikke-designere.

- [x] Færdig — 6 preset farveskemaer (Standard, Blå, Rød, Grøn, Guld, Lilla) med auto-regenerering

### #18 — Preview i fuld størrelse (lightbox) (P2)
Klik på QR-kode preview for at se den i en lightbox/modal i fuld størrelse. Nyttigt til at verificere scannability.

- [x] Færdig — klik på QR preview åbner fullscreen lightbox med Escape/klik-luk

### #19 — Responsiv tab-navigation som swipeable (P2)
På mobil: gør QR-type tabs swipeable (venstre/højre) i stedet for at scrolle horisontalt. Mere naturlig mobil-interaktion.

- [x] Færdig — touch swipe med slide-animation, 50px threshold, diagonal gesture filtering

### #20 — Form-validering med inline-fejl (P1)
Vis fejlmeddelelser direkte ved felterne (f.eks. "Ugyldig e-mail-adresse", "URL mangler https://") i stedet for generiske alerts.

- [x] Færdig — inline fejlbeskeder med aria-invalid, auto-clear og WiFi special char escaping

### #21 — Skeleton loading state (P3)
Vis en skeleton/placeholder for QR-kode preview-området mens den genereres, i stedet for tomt rum.

- [x] Færdig — animeret skeleton med shimmer-effekt som placeholder før QR-generering

### #22 — Sticky preview-panel på desktop (P2)
Gør QR-kode preview-panelet sticky (position: sticky) så det altid er synligt mens brugeren scroller ned i indstillinger.

- [x] Færdig — position: sticky på desktop, static på mobil

### #23 — Forbedret historik-visning (P2)
Tilføj filtrering og søgning i historikken. Vis QR-type som badge. Tilføj mulighed for at give QR-koder et navn/label.

- [x] Færdig — søgning, typefilter, farvede badges, omdøbning af historik-entries

### #24 — Keyboard shortcuts overlay (P3)
Tilføj en `?`-shortcut der viser en modal med alle tilgængelige keyboard shortcuts.

- [x] Færdig — ? åbner modal med G/D/C/T/1-6/Esc genveje, deaktiveres i form-felter

### #25 — Animeret QR-kode generation (P3)
Subtil animation når QR-koden genereres (fade-in, scale fra 0.95 til 1.0). Giver en mere poleret oplevelse.

- [x] Færdig — CSS keyframe animation med fade-in og scale (0.3s ease-out)

### #26 — Forbedret batch-UI med progressbar (P2)
Vis en progressbar under batch-generation. Tilføj mulighed for at preview individuelle QR-koder i batchen før download.

- [x] Færdig — animeret progressbar, forhåndsvis-knap med thumbnail-grid

### #27 — Scroll-to-top knap (P3)
Vis en diskret "scroll til top" knap når brugeren har scrollet ned i indholdet under folden.

- [x] Færdig — fixed knap nederst til højre, vises efter 400px scroll, smooth scroll til top

### #28 — Forbedret mobilmenu/navigation (P2)
Tilføj en kompakt hamburger-menu på mobil med links til alle undersider, guides og QR-typer.

- [x] Færdig — hamburger-knap med slide-in drawer, overlay, Escape-luk og scroll-lock

---

## Nye Features (29–42)

### #29 — QR-kode scanner (kamera) (P0)
Tilføj en "Scan QR-kode" funktion der bruger enhedens kamera via WebRTC/`getUserMedia`. Kan aflæse og vise indholdet af enhver QR-kode. Gør sitet til et komplet QR-værktøj.

- [x] Færdig (50a90b3)

### #30 — PWA (Progressive Web App) (P0)
Tilføj `manifest.json` og service worker. Gør det muligt at installere appen på hjemmeskærmen og bruge den offline. Alle QR-koder genereres allerede client-side.

- [x] Færdig (28049e8)

### #31 — QR-kode skabeloner (P1)
Foruddefinerede skabeloner for typiske use-cases: "Restaurant menu", "WiFi til gæster", "Visitkort", "Event invitation". Udfyld kun de relevante felter.

- [x] Færdig — 6 skabeloner i collapsible sektion med auto-udfyldning og CTA-tekst

### #32 — Del QR-kode direkte (Web Share API) (P1)
Integrer Web Share API (`navigator.share`) så brugere kan dele QR-koden direkte til SMS, mail, WhatsApp osv. med ét klik.

- [x] Færdig — Del-knap med navigator.share(), canShare check og fallback

### #33 — QR-kode med frame/ramme og CTA-tekst (P2)
Tilføj mulighed for at tilføje en dekorativ ramme rundt om QR-koden med call-to-action tekst (f.eks. "Scan mig!", "Forbind til WiFi").

- [x] Færdig — CTA-tekst felt der tegnes under QR-koden på canvas med auto-regenerering

### #34 — Print-optimeret visning (P2)
"Print" knap der åbner en print-venlig version med QR-koden i høj opløsning, valgfri label-tekst, og korrekte print-margins. Bruger `@media print`.

- [x] Færdig — Print-knap med clean @media print layout, skjuler alt undtagen QR preview

### #35 — Upload billede → scan QR (P2)
Udover kamera-scan: tilføj mulighed for at uploade et screenshot/foto der indeholder en QR-kode. Dekod og vis indholdet.

- [x] Færdig — allerede implementeret som del af #29 (scanner) med jsQR og file input

### #36 — Geo-lokation QR-kode (P2)
Ny QR-type: `geo:lat,long` der åbner en kortapplikation med den angivne lokation. Nyttigt for events, butikker, parkeringspladser.

- [x] Færdig — ny geo-tab med lat/lng/label felter, geolocation API, Google Maps intent URI med label-support

### #37 — PayPal/MobilePay QR-kode (P2)
Ny QR-type for betalingslinks. Generér QR-koder der linker til MobilePay Box-numre eller PayPal.me-links.

- [x] Færdig — ny betaling-tab med PayPal.me og MobilePay deep link support, beløb og kommentar

### #38 — Eksporter som PDF (P2)
Tilføj PDF som eksportformat. Generér en A4-side med QR-koden centreret, valgfri titel og beskrivelse. Ideel til print.

- [x] Færdig — PDF (A4) som eksportformat med centreret QR-kode, ingen ekstern afhængighed

### #39 — Bulk import fra CSV (P2)
Batch-generation via CSV-upload. Upload en fil med URL'er, kontakter, WiFi-netværk osv. og generér QR-koder for alle rækker.

- [x] Færdig — CSV/TSV import med auto-delimiter detection, header-skip og første kolonne til batch textarea

### #40 — Social media QR-profiler (P3)
Ny QR-type: "Social profil" der samler links til Instagram, Facebook, LinkedIn, TikTok osv. i én QR-kode (linktree-style landing).

- [ ] Ikke startet

### #41 — QR-kode sammenligning (P3)
Vis to QR-koder side om side med forskellige indstillinger (størrelse, fejlkorrektion, stil) så brugeren kan vælge den bedste.

- [x] Færdig — sammenlign-knap der viser alle 3 stilarter (Standard, Afrundet, Prikker) side om side

### #42 — Favoritter/gemte QR-koder (P3)
Udover historik: lad brugere markere QR-koder som favoritter der ikke automatisk slettes fra listen. Persisteres i localStorage.

- [x] Færdig — stjerne-toggle på historik-entries, favoritter beskyttes mod auto-sletning, filter og visuel markering

---

## Design & Visuelt (43–52)

### #43 — Micro-interaktioner (P2)
Tilføj subtile hover-animationer på tabs (underline slide), knapper (ripple-effekt), og toggle switches. Giver en mere premium følelse.

- [x] Færdig — tab underline slide, button ripple, theme toggle rotation, tab press-down scale

### #44 — Forbedret dark/light mode transition (P3)
Tilføj en smooth `view-transition` ved theme-skift i stedet for den nuværende instant-switch. Moderne browsers understøtter `document.startViewTransition()`.

- [x] Færdig — document.startViewTransition() med graceful fallback for ældre browsere

### #45 — Ikon-konsistens (SVG ikoner) (P2)
Erstat emoji-ikoner (📱, 📧, osv.) med et konsistent SVG-ikonsæt (f.eks. inline Lucide/Heroicons). Giver et mere professionelt udtryk.

- [ ] Ikke startet

### #46 — Forbedret footer-design (P3)
Redesign footer med columns: Links, QR-typer, Om os, Juridisk. Tilføj social media-links og "Bygget med ❤️ i Danmark".

- [ ] Ikke startet

### #47 — QR-kode style-preview grid (P2)
Vis de tre QR-stilarter (standard, rundet, dots) som visuelle previews i stedet for en dropdown. Brugeren klikker på den stil de vil have.

- [x] Færdig — 3 SVG-preview cards der erstatter dropdown, synkroniseret med hidden select

### #48 — Forbedret farvevælger-UI (P2)
Vis forgrund- og baggrundsfarve som et lille preview-swatch ved siden af color-input. Tilføj "byt farver" knap (swap foreground/background).

- [x] Færdig — farveswatch preview, swap-knap mellem forgrund/baggrund med auto-regenerering

### #49 — Responsiv illustration/hero (P3)
Tilføj en simpel SVG-illustration i hero-sektionen der viser en telefon der scanner en QR-kode. Animér med CSS.

- [ ] Ikke startet

### #50 — Settings-panel som collapsible sektioner (P2)
Gruppér indstillinger (Stil, Farver, Størrelse, Format) i collapsible accordion-sektioner med ikoner. Reducerer visuel overload.

- [x] Færdig — 3 collapsible details-sektioner (Stil, Farver, Størrelse & Format) med ikoner og pil-animation

### #51 — Forbedret error correction level-UI (P3)
Vis fejlkorrektionsniveauer visuelt med en slider og en kort forklaring af hvad hvert niveau betyder i praksis ("Lav: til rene overflader", "Høj: til print med logo").

- [x] Færdig — segmenteret L/M/Q/H kontrol med kontekstuelle hinttekster

### #52 — High-contrast mode (P3)
Tilføj en high-contrast farve-variant for synshandicappede brugere. Kan aktiveres via en tilgængeligheds-toggle i headeren.

- [x] Færdig — kontrasttoggle i header med gul/cyan (mørk) og blå/rød (lys) high-contrast tema

---

## Teknisk & Performance (53–58)

### #53 — Service Worker + offline-support (P1)
Cache alle statiske assets. Brugere kan generere QR-koder uden internetforbindelse. Naturlig forlængelse af PWA (#30).

- [x] Færdig — alle sider precached, offline fallback til hovedside, stale-while-revalidate

### #54 — Self-host QR-bibliotek (P2)
Flyt `qrcode-generator` og `jszip` fra CDN til self-hosted. Eliminerer ekstern afhængighed, forbedrer load-tid og eliminerer SPOF.

- [x] Færdig — alle 3 biblioteker (qrcode, jszip, jsQR) self-hosted i /lib/, CSP opdateret, preconnect fjernet

### #55 — CSS/JS minificering og bundling (P2)
Tilføj en simpel build-step (f.eks. esbuild/lightningcss) der minificerer og bundler assets. Reducerer filstørrelse 30-50%.

- [x] Færdig — esbuild build-step med multi-stage Dockerfile, style.css -32%, app.js -44%

### #56 — Lazy-load below-fold sektioner (P2)
Brug `IntersectionObserver` til at lazy-loade SEO-indhold, FAQ, tips-grid osv. Forbedrer initial load og LCP.

- [x] Færdig — IntersectionObserver fade-in på SEO-content og footer, fallback for ældre browsere

### #57 — Prerender populære ruter (P3)
Tilføj `<link rel="prerender">` eller speculation rules for de mest besøgte undersider. Giver instant navigation.

- [x] Færdig — Speculation Rules API med prerender for top 3 sider, prefetch for resten

### #58 — Automated Lighthouse CI (P3)
Opsæt GitHub Action der kører Lighthouse på hver PR og blokerer merge hvis score falder under threshold (Performance > 90, A11y > 95, SEO > 95).

- [ ] Ikke startet

---

## Tilgængelighed (59–62)

### #59 — Screen reader QR-indhold (P1)
Tilføj `aria-live` region der annoncerer QR-kodens indhold til screen readers når den genereres ("QR-kode genereret for URL: example.com").

- [x] Færdig — aria-live assertive region annoncerer QR-type og indhold ved generering

### #60 — Forbedret fokus-management (P2)
Ved tab-skift: flyt fokus automatisk til første input-felt i den nye tab. Ved QR-generation: flyt fokus til preview/download-området.

- [x] Færdig — auto-fokus på første input ved tab-skift og fokus til QR preview efter generering

### #61 — Tekststørrelses-kontrol (P3)
Tilføj en A/A+/A++ kontrol i headeren der justerer base font-size. Nyttigt for ældre brugere og synshæmmede.

- [x] Færdig — A/A+/A++ toggle i header med 100%/112.5%/125% font-size, localStorage-persisteret

### #62 — WCAG AAA farvekontrast-audit (P2)
Gennemgå og justér alle farver så de overholder WCAG AAA (7:1 kontrast). Særligt muted-tekst og placeholder-tekst.

- [x] Færdig — text-muted justeret til 7:1+ kontrast i både dark (#acb7c6) og light (#475569) tema

---

## Opsummering

| Kategori | Antal | P0 Kritisk | P1 Høj | P2 Medium | P3 Lav |
|----------|-------|-----------|---------|-----------|--------|
| SEO & Synlighed | 12 | 1 | 3 | 4 | 4 |
| UI/UX | 16 | 1 | 3 | 7 | 5 |
| Nye Features | 14 | 2 | 2 | 6 | 4 |
| Design & Visuelt | 10 | 0 | 0 | 5 | 5 |
| Teknisk & Performance | 6 | 0 | 1 | 3 | 2 |
| Tilgængelighed | 4 | 0 | 1 | 2 | 1 |
| **Total** | **62** | **4** | **10** | **27** | **21** |

### Anbefalet sprint-plan

**Sprint 1 — Quick wins med stor impact:**
#15 Kopiér til clipboard, #29 QR-scanner, #30 PWA, #1 Landingssider

**Sprint 2 — UX polish:**
#13 Onboarding tooltips, #16 Toast-system, #20 Inline form-validering, #22 Sticky preview, #14 Logo drag-and-drop

**Sprint 3 — Feature expansion:**
#32 Web Share API, #33 QR med ramme/CTA-tekst, #34 Print-optimeret visning, #31 Skabeloner

**Sprint 4 — SEO & Performance:**
#10 Core Web Vitals, #2 Blog/guides, #54 Self-host biblioteker, #55 CSS/JS minificering
