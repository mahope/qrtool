# QR Tool - Professionel QR-Kode Generator

En moderne, funktionsrig QR-kode generator med avancerede tilpasningsmuligheder. Hostet på [QRTool.dk](https://qrtool.dk)

Lavet af [Mahope.dk](https://mahope.dk)

## ✨ Features

### 🎨 Design & Tilpasning
- **Farvetilpasning**: Vælg custom farver for både QR-koden og baggrunden
- **Transparent Baggrund**: Support for transparent baggrund (PNG/SVG)
- **QR-kode Stilarter**: Vælg mellem standard firkanter, afrundede hjørner eller prikker
- **Multiple Størrelser**: 256px, 512px, 1024px, 2048px
- **Fejlkorrektion**: Vælg mellem 4 niveauer (L, M, Q, H)
- **Multiple Formater**: PNG, JPG, SVG, WebP

### 📱 Specialiserede QR-kode Typer
- **📝 Tekst/URL**: Standard QR-koder med tekst eller URLs
- **📶 WiFi**: Generer QR-koder til WiFi login (SSID, password, encryption)
- **👤 vCard**: Digitale visitkort med kontaktinfo
- **✉️ Email**: Forudfyldte email beskeder
- **💬 SMS**: Pre-written SMS beskeder
- **📅 Kalender**: iCalendar events til kalendere

### 🚀 Produktivitet
- **📦 Batch Generering**: Generer flere QR-koder på én gang og download som ZIP
- **📜 Historik**: Automatisk gem dine seneste 20 QR-koder med localStorage
- **⚡ Live Preview**: Se din QR-kode i real-time
- **🔄 Auto-generering**: QR-koden opdateres automatisk mens du skriver
- **⌨️ Keyboard Shortcuts**: Tryk Enter for at generere
- **🌓 Dark/Light Mode**: Toggle mellem mørk og lys tema

## 🚀 Kom i gang

1. Åben `index.html` i din browser
2. Vælg QR-kode type (Tekst, WiFi, vCard, etc.)
3. Udfyld den nødvendige information
4. Tilpas design efter behov (farver, stil, logo)
5. Klik "Generer QR-kode" eller vent på auto-generering
6. Klik "Download" for at gemme

## 🎨 Indstillinger

### QR-kode Typer

#### WiFi QR-koder
Generer QR-koder som automatisk forbinder til WiFi netværk når de scannes:
- Netværksnavn (SSID)
- Adgangskode
- Krypteringstype (WPA/WPA2, WEP, Åben)
- Skjult netværk support

#### vCard (Digital Visitkort)
Gem kontaktinfo direkte til kontakter ved scanning:
- Navn
- Organisation & titel
- Telefon & email
- Hjemmeside
- Adresse

#### Email & SMS
Pre-written beskeder:
- Email: Modtager, emne, besked
- SMS: Telefonnummer, besked

#### Kalender Events
iCalendar events der kan tilføjes direkte til kalender:
- Begivenhedsnavn
- Lokation
- Start & slut tidspunkt
- Beskrivelse

### Farver & Design
- **QR-kode farve**: Vælg farven på selve QR-koden
- **Baggrundsfarve**: Vælg baggrundsfarven (deaktiveret hvis transparent)
- **Stil**: Standard firkanter, afrundede hjørner eller prikker

### Størrelse
- 256×256px (Lille) - Til web og mobil
- 512×512px (Medium) - Standard størrelse
- 1024×1024px (Stor) - Til print
- 2048×2048px (Meget stor) - Høj opløsning

### Fejlkorrektion
Højere fejlkorrektion betyder at QR-koden kan læses selvom den er delvist beskadiget:
- **Lav (L)**: ~7% fejlkorrektion
- **Medium (M)**: ~15% fejlkorrektion - Anbefalet for de fleste
- **Høj (Q)**: ~25% fejlkorrektion
- **Meget høj (H)**: ~30% fejlkorrektion - Brug til udendørs eller print

### Filformater
- **PNG**: Bedst til web, support for transparent baggrund
- **JPG**: Mindre filstørrelse, ingen transparent baggrund
- **SVG**: Vektorbaseret, perfekt skalering, bedst til print
- **WebP**: Moderne format med god kompression

## 📦 Batch Generering

Generer flere QR-koder på én gang:
1. Klik på "Batch Generering" sektionen
2. Indtast URLs/tekster (én per linje)
3. Maksimalt 100 QR-koder ad gangen
4. Download alle som en ZIP fil
5. Hver QR-kode navngives automatisk (qr-1, qr-2, etc.)

## 📜 Historik

QR Tool husker dine seneste 20 genererede QR-koder:
- Automatisk gem til localStorage
- Se type-ikon for hver QR-kode
- Genindlæs tidligere QR-koder med ét klik
- Slet individuelle eller hele historikken

## 📁 Projektstruktur

```
qr-code-generator/
├── index.html      # Hovedfil med HTML struktur
├── style.css       # Styling og layout
├── app.js          # JavaScript funktionalitet
├── package.json    # NPM dependencies
└── README.md       # Denne fil
```

## 🛠️ Teknologier

- **QRCode.js**: QR-kode generering
- **JSZip**: Batch generation med ZIP download
- **Vanilla JavaScript**: Ingen frameworks påkrævet
- **Modern CSS**: Grid, Flexbox, Custom Properties
- **Responsive Design**: Fungerer på alle skærmstørrelser
- **localStorage**: Historik og tema præferencer

## 💡 Tips

- Brug højere fejlkorrektion hvis QR-koden skal printes eller bruges udendørs
- SVG format er bedst til print da det skalerer perfekt
- PNG med transparent baggrund er ideelt til at placere på forskellige baggrunde
- Større størrelser giver bedre scanbarhed på afstand
- WiFi QR-koder virker på de fleste moderne smartphones
- vCard QR-koder gemmer automatisk til kontakter ved scanning

## 🔍 SEO & Metadata

Siden er fuldt optimeret til SEO med:
- Comprehensive meta tags (title, description, keywords)
- Open Graph tags til social media
- Twitter Card support
- Schema.org structured data
- Canonical URL
- Responsive meta viewport
- Dansk sprog optimering

## 📱 Browser Support

- Chrome/Edge: ✅ Fuld support
- Firefox: ✅ Fuld support
- Safari: ✅ Fuld support
- Opera: ✅ Fuld support
- Mobile browsers: ✅ Fuld support

WebP format kan have begrænset support i ældre browsere.

## 🚀 Performance

- Lazy loading af QR-kode generering
- Debounced auto-generation (1s delay)
- Efficient canvas rendering
- Optimized SVG generation
- LocalStorage caching

## 📄 Licens

Open source - brug frit!

## 👨‍💻 Udviklet af

[Mahope.dk](https://mahope.dk) - Webudvikling og digitale løsninger

---

**QRTool.dk** - Din professionelle QR-kode generator 🚀
