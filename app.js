// ===========================================
// i18n — Language detection & translations
// ===========================================

const LANG = document.documentElement.lang || 'da';
const T = {
    da: {
        // Templates
        'tpl.loaded': 'Skabelon "{name}" indlæst.',
        'tpl.restaurant': 'Se vores menu',
        'tpl.wifi': 'Forbind til WiFi',
        'tpl.vcard': 'Scan for kontaktinfo',
        'tpl.event': 'Tilføj til kalender',
        'tpl.social': 'Følg os',
        'tpl.feedback': 'Giv os feedback',
        'tpl.restaurantUrl': 'https://dinrestaurant.dk/menu',
        'tpl.socialUrl': 'https://instagram.com/ditbrugernavn',
        'tpl.feedbackUrl': 'https://forms.gle/dit-formular-link',

        // Error correction hints
        'ec.L': 'Lav (~7%) — Til rene overflader og digitale skærme',
        'ec.M': 'Medium (~15%) — Anbefalet til de fleste formål',
        'ec.Q': 'Høj (~25%) — Til print og overflader med lidt slid',
        'ec.H': 'Meget høj (~30%) — Til print med logo eller udendørs brug',

        // Compare style labels
        'style.square': 'Standard',
        'style.rounded': 'Afrundet',
        'style.dots': 'Prikker',

        // Validation errors
        'err.textRequired': 'Indtast tekst eller en URL.',
        'err.ssidRequired': 'Netværksnavn er påkrævet.',
        'err.nameRequired': 'Navn er påkrævet.',
        'err.invalidEmail': 'Ugyldig e-mail-adresse.',
        'err.urlHttps': 'URL skal starte med https://',
        'err.emailRequired': 'E-mail-adresse er påkrævet.',
        'err.phoneRequired': 'Telefonnummer er påkrævet.',
        'err.eventNameRequired': 'Begivenhedsnavn er påkrævet.',
        'err.startDateRequired': 'Startdato er påkrævet.',
        'err.latRequired': 'Breddegrad er påkrævet.',
        'err.latRange': 'Breddegrad skal være mellem -90 og 90.',
        'err.lngRequired': 'Længdegrad er påkrævet.',
        'err.lngRange': 'Længdegrad skal være mellem -180 og 180.',
        'err.usernameRequired': 'Brugernavn er påkrævet.',
        'err.paypalRequired': 'PayPal brugernavn er påkrævet.',
        'err.mobilepayRequired': 'Telefonnummer er påkrævet.',

        // Toast messages
        'toast.generated': 'QR-kode genereret!',
        'toast.downloaded': 'QR-kode downloadet!',
        'toast.copied': 'Kopieret til udklipsholder!',
        'toast.shared': 'QR-kode delt!',
        'toast.generateFirst': 'Generer venligst en QR-kode først!',
        'toast.generateError': 'Fejl ved generering: ',
        'toast.downloadError': 'Fejl ved download: ',
        'toast.copyError': 'Kunne ikke kopiere. Sørg for at siden kører over HTTPS.',
        'toast.copyUnsupported': 'Din browser understøtter ikke kopiering af billeder. Prøv Chrome eller Edge.',
        'toast.blobError': 'Kunne ikke oprette billede. Prøv en mindre størrelse.',
        'toast.shareUnsupported': 'Deling er ikke understøttet i din browser. Prøv at kopiere i stedet.',
        'toast.shareImageUnsupported': 'Din browser understøtter ikke deling af billeder.',
        'toast.shareError': 'Kunne ikke dele QR-koden.',
        'toast.shareImageError': 'Kunne ikke oprette billede til deling.',
        'toast.webpUnsupported': 'Din browser understøtter ikke WebP. Vælg et andet format.',
        'toast.logoEcBoosted': 'Fejlkorrektion sat til Meget høj for bedre logo-kompatibilitet.',
        'toast.logoLoadError': 'Kunne ikke indlæse billedet.',
        'toast.textCopied': 'Tekst kopieret til udklipsholder!',

        // Batch
        'batch.enterText': 'Indtast venligst mindst én URL/tekst!',
        'batch.max100': 'Maksimalt 100 QR-koder ad gangen!',
        'batch.jszipMissing': 'JSZip biblioteket mangler. Genindlæs siden.',
        'batch.generating': 'Genererer...',
        'batch.downloaded': '{n} QR-koder downloadet som ZIP!',
        'batch.error': 'Fejl ved batch generering: ',
        'batch.preview': '{n} QR-koder vist i forhåndsvisning',

        // CSV
        'csv.empty': 'CSV-filen er tom.',
        'csv.noData': 'Ingen data fundet i CSV-filen.',
        'csv.imported': '{n} rækker importeret fra CSV.',

        // History
        'history.empty': 'Ingen tidligere QR-koder',
        'history.noResults': 'Ingen resultater',
        'history.confirmClear': 'Er du sikker på at du vil slette hele historikken?',
        'history.addedFav': 'Tilføjet til favoritter',
        'history.removedFav': 'Fjernet fra favoritter',
        'history.rename': 'Giv QR-koden et navn:',

        // Type labels
        'type.text': 'Tekst/URL',
        'type.wifi': 'WiFi',
        'type.vcard': 'vCard',
        'type.email': 'Email',
        'type.sms': 'SMS',
        'type.calendar': 'Kalender',
        'type.geo': 'Lokation',
        'type.payment': 'Betaling',
        'type.social': 'Social',

        // Aria / Announcements
        'aria.qrGenerated': 'QR-kode genereret for {type}: {preview}',
        'aria.removeFav': 'Fjern fra favoritter',
        'aria.addFav': 'Tilføj til favoritter',
        'aria.rename': 'Giv denne QR-kode et navn',
        'aria.reload': 'Genindlæs denne QR-kode',
        'aria.delete': 'Slet denne QR-kode fra historik',
        'aria.removeFavTitle': 'Fjern favorit',
        'aria.addFavTitle': 'Tilføj favorit',
        'aria.renameTitle': 'Omdøb',
        'aria.reloadTitle': 'Genindlæs',
        'aria.deleteTitle': 'Slet',

        // Share
        'share.title': 'QR-kode fra QRTool.dk',
        'share.filename': 'qr-kode.png',

        // Scanner
        'scanner.libMissing': 'QR-scanner biblioteket mangler. Genindlæs siden.',
        'scanner.camDenied': 'Kameraadgang blev afvist. Tillad kameraadgang i din browser.',
        'scanner.camError': 'Kunne ikke starte kameraet. Har din enhed et kamera?',
        'scanner.noQR': 'Ingen QR-kode fundet i billedet. Prøv et andet billede.',
        'scanner.imgError': 'Kunne ikke indlæse billedet.',

        // Geo
        'geo.unsupported': 'Geolokation understøttes ikke i denne browser.',
        'geo.fetching': 'Henter placering...',
        'geo.useMyLocation': 'Brug min placering',
        'geo.fetched': 'Placering hentet!',
        'geo.denied': 'Adgang til placering blev nægtet.',
        'geo.unavailable': 'Placering ikke tilgængelig.',
        'geo.timeout': 'Anmodning udløb.',
        'geo.error': 'Kunne ikke hente placering.',

        // Onboarding
        'onboard.step': 'Trin {n} af {total}',
        'onboard.skip': 'Spring over',
        'onboard.next': 'Næste',
        'onboard.done': 'Forstået',
        'onboard.ariaLabel': 'Introduktionsrundvisning',
        'onboard.step1': 'Vælg hvilken type QR-kode du vil lave — tekst, WiFi, visitkort og mere.',
        'onboard.step2': 'Udfyld oplysningerne for din QR-kode her. Felterne ændrer sig med den valgte type.',
        'onboard.step3': 'Tryk Generer for at se din QR-kode, og Download eller Kopiér den bagefter.',

        // Date locale
        'locale': 'da-DK',

        // History date
        'history.dateLocale': 'da-DK',
    },
    en: {
        // Templates
        'tpl.loaded': 'Template "{name}" loaded.',
        'tpl.restaurant': 'See our menu',
        'tpl.wifi': 'Connect to WiFi',
        'tpl.vcard': 'Scan for contact info',
        'tpl.event': 'Add to calendar',
        'tpl.social': 'Follow us',
        'tpl.feedback': 'Give us feedback',
        'tpl.restaurantUrl': 'https://yourrestaurant.com/menu',
        'tpl.socialUrl': 'https://instagram.com/yourusername',
        'tpl.feedbackUrl': 'https://forms.gle/your-form-link',

        // Error correction hints
        'ec.L': 'Low (~7%) — For clean surfaces and digital screens',
        'ec.M': 'Medium (~15%) — Recommended for most purposes',
        'ec.Q': 'High (~25%) — For print and surfaces with some wear',
        'ec.H': 'Very high (~30%) — For print with logo or outdoor use',

        // Compare style labels
        'style.square': 'Standard',
        'style.rounded': 'Rounded',
        'style.dots': 'Dots',

        // Validation errors
        'err.textRequired': 'Please enter text or a URL.',
        'err.ssidRequired': 'Network name is required.',
        'err.nameRequired': 'Name is required.',
        'err.invalidEmail': 'Invalid email address.',
        'err.urlHttps': 'URL must start with https://',
        'err.emailRequired': 'Email address is required.',
        'err.phoneRequired': 'Phone number is required.',
        'err.eventNameRequired': 'Event name is required.',
        'err.startDateRequired': 'Start date is required.',
        'err.latRequired': 'Latitude is required.',
        'err.latRange': 'Latitude must be between -90 and 90.',
        'err.lngRequired': 'Longitude is required.',
        'err.lngRange': 'Longitude must be between -180 and 180.',
        'err.usernameRequired': 'Username is required.',
        'err.paypalRequired': 'PayPal username is required.',
        'err.mobilepayRequired': 'Phone number is required.',

        // Toast messages
        'toast.generated': 'QR code generated!',
        'toast.downloaded': 'QR code downloaded!',
        'toast.copied': 'Copied to clipboard!',
        'toast.shared': 'QR code shared!',
        'toast.generateFirst': 'Please generate a QR code first!',
        'toast.generateError': 'Generation error: ',
        'toast.downloadError': 'Download error: ',
        'toast.copyError': 'Could not copy. Make sure the page runs over HTTPS.',
        'toast.copyUnsupported': 'Your browser does not support image copying. Try Chrome or Edge.',
        'toast.blobError': 'Could not create image. Try a smaller size.',
        'toast.shareUnsupported': 'Sharing is not supported in your browser. Try copying instead.',
        'toast.shareImageUnsupported': 'Your browser does not support sharing images.',
        'toast.shareError': 'Could not share the QR code.',
        'toast.shareImageError': 'Could not create image for sharing.',
        'toast.webpUnsupported': 'Your browser does not support WebP. Choose another format.',
        'toast.logoEcBoosted': 'Error correction set to Very High for better logo compatibility.',
        'toast.logoLoadError': 'Could not load the image.',
        'toast.textCopied': 'Text copied to clipboard!',

        // Batch
        'batch.enterText': 'Please enter at least one URL/text!',
        'batch.max100': 'Maximum 100 QR codes at a time!',
        'batch.jszipMissing': 'JSZip library is missing. Reload the page.',
        'batch.generating': 'Generating...',
        'batch.downloaded': '{n} QR codes downloaded as ZIP!',
        'batch.error': 'Batch generation error: ',
        'batch.preview': '{n} QR codes shown in preview',

        // CSV
        'csv.empty': 'The CSV file is empty.',
        'csv.noData': 'No data found in the CSV file.',
        'csv.imported': '{n} rows imported from CSV.',

        // History
        'history.empty': 'No previous QR codes',
        'history.noResults': 'No results',
        'history.confirmClear': 'Are you sure you want to delete the entire history?',
        'history.addedFav': 'Added to favorites',
        'history.removedFav': 'Removed from favorites',
        'history.rename': 'Give the QR code a name:',

        // Type labels
        'type.text': 'Text/URL',
        'type.wifi': 'WiFi',
        'type.vcard': 'vCard',
        'type.email': 'Email',
        'type.sms': 'SMS',
        'type.calendar': 'Calendar',
        'type.geo': 'Location',
        'type.payment': 'Payment',
        'type.social': 'Social',

        // Aria / Announcements
        'aria.qrGenerated': 'QR code generated for {type}: {preview}',
        'aria.removeFav': 'Remove from favorites',
        'aria.addFav': 'Add to favorites',
        'aria.rename': 'Give this QR code a name',
        'aria.reload': 'Reload this QR code',
        'aria.delete': 'Delete this QR code from history',
        'aria.removeFavTitle': 'Remove favorite',
        'aria.addFavTitle': 'Add favorite',
        'aria.renameTitle': 'Rename',
        'aria.reloadTitle': 'Reload',
        'aria.deleteTitle': 'Delete',

        // Share
        'share.title': 'QR code from QRTool.dk',
        'share.filename': 'qr-code.png',

        // Scanner
        'scanner.libMissing': 'QR scanner library is missing. Reload the page.',
        'scanner.camDenied': 'Camera access was denied. Allow camera access in your browser.',
        'scanner.camError': 'Could not start the camera. Does your device have a camera?',
        'scanner.noQR': 'No QR code found in the image. Try another image.',
        'scanner.imgError': 'Could not load the image.',

        // Geo
        'geo.unsupported': 'Geolocation is not supported in this browser.',
        'geo.fetching': 'Fetching location...',
        'geo.useMyLocation': 'Use my location',
        'geo.fetched': 'Location fetched!',
        'geo.denied': 'Location access was denied.',
        'geo.unavailable': 'Location not available.',
        'geo.timeout': 'Request timed out.',
        'geo.error': 'Could not fetch location.',

        // Onboarding
        'onboard.step': 'Step {n} of {total}',
        'onboard.skip': 'Skip',
        'onboard.next': 'Next',
        'onboard.done': 'Got it',
        'onboard.ariaLabel': 'Introductory guided tour',
        'onboard.step1': 'Choose what type of QR code you want to create — text, WiFi, business card and more.',
        'onboard.step2': 'Fill in the details for your QR code here. The fields change with the selected type.',
        'onboard.step3': 'Press Generate to see your QR code, then Download or Copy it.',

        // Date locale
        'locale': 'en-US',

        // History date
        'history.dateLocale': 'en-US',
    }
};

function t(key, params) {
    let str = T[LANG]?.[key] || T.da[key] || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, v);
        }
    }
    return str;
}

// Theme management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'dark'
const currentTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', currentTheme);

// Theme toggle handler (with null check)
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const theme = html.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                html.setAttribute('data-theme', newTheme);
            });
        } else {
            html.setAttribute('data-theme', newTheme);
        }
        localStorage.setItem('theme', newTheme);
    });
}

// Font size toggle
const fontSizeToggle = document.getElementById('fontSizeToggle');
if (fontSizeToggle) {
    const sizes = [null, 'large', 'x-large'];
    const labels = ['A', 'A+', 'A++'];
    let sizeIdx = sizes.indexOf(localStorage.getItem('fontSize'));
    if (sizeIdx < 0) sizeIdx = 0;
    if (sizes[sizeIdx]) html.setAttribute('data-font-size', sizes[sizeIdx]);
    fontSizeToggle.querySelector('span').textContent = labels[sizeIdx];

    fontSizeToggle.addEventListener('click', () => {
        sizeIdx = (sizeIdx + 1) % sizes.length;
        if (sizes[sizeIdx]) {
            html.setAttribute('data-font-size', sizes[sizeIdx]);
            localStorage.setItem('fontSize', sizes[sizeIdx]);
        } else {
            html.removeAttribute('data-font-size');
            localStorage.removeItem('fontSize');
        }
        fontSizeToggle.querySelector('span').textContent = labels[sizeIdx];
    });
}

// High contrast toggle
const contrastToggle = document.getElementById('contrastToggle');
if (contrastToggle) {
    const savedContrast = localStorage.getItem('contrast');
    if (savedContrast === 'high') {
        html.setAttribute('data-contrast', 'high');
        contrastToggle.classList.add('active');
    }
    contrastToggle.addEventListener('click', () => {
        const isHigh = html.getAttribute('data-contrast') === 'high';
        if (isHigh) {
            html.removeAttribute('data-contrast');
            localStorage.removeItem('contrast');
            contrastToggle.classList.remove('active');
        } else {
            html.setAttribute('data-contrast', 'high');
            localStorage.setItem('contrast', 'high');
            contrastToggle.classList.add('active');
        }
    });
}

// Tab management
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const tabOrder = ['text', 'wifi', 'vcard', 'email', 'sms', 'calendar', 'geo', 'payment', 'social'];
let currentTab = 'text';

function switchToTab(tabName, { autoFocus = true } = {}) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const btn = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
    const activeContent = document.querySelector(`[data-content="${tabName}"]`);
    if (activeContent) {
        activeContent.classList.add('active');
        currentTab = tabName;
        if (autoFocus) {
            const firstInput = activeContent.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => switchToTab(button.dataset.tab));
});

// Swipe between tabs on touch devices
(() => {
    const formArea = document.querySelector('.qr-type-tabs')?.parentElement;
    if (!formArea) return;
    let startX = 0, startY = 0;
    const MIN_SWIPE = 50;

    formArea.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    formArea.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(dx) < MIN_SWIPE || Math.abs(dy) > Math.abs(dx)) return;
        const idx = tabOrder.indexOf(currentTab);
        let newTab = null;
        if (dx < 0 && idx < tabOrder.length - 1) {
            newTab = tabOrder[idx + 1];
        } else if (dx > 0 && idx > 0) {
            newTab = tabOrder[idx - 1];
        }
        if (newTab) {
            if (typeof clearAllErrors === 'function') clearAllErrors();
            switchToTab(newTab, { autoFocus: false });
            const content = document.querySelector(`[data-content="${newTab}"]`);
            if (content) {
                content.classList.remove('swipe-left', 'swipe-right');
                content.classList.add(dx < 0 ? 'swipe-right' : 'swipe-left');
                content.addEventListener('animationend', () => {
                    content.classList.remove('swipe-left', 'swipe-right');
                }, { once: true });
            }
        }
    }, { passive: true });
})();

// ===========================================
// Quick Templates
// ===========================================

const templates = {
    'restaurant-menu': {
        tab: 'text',
        fields: { qrText: t('tpl.restaurantUrl') },
        cta: t('tpl.restaurant')
    },
    'wifi-guest': {
        tab: 'wifi',
        fields: { wifiSSID: 'GuestWiFi', wifiPassword: '', wifiEncryption: 'WPA' },
        cta: t('tpl.wifi')
    },
    'business-card': {
        tab: 'vcard',
        fields: { vcardName: '', vcardOrg: '', vcardTitle: '', vcardPhone: '', vcardEmail: '' },
        cta: t('tpl.vcard')
    },
    'event-invite': {
        tab: 'calendar',
        fields: { calTitle: '', calLocation: '' },
        cta: t('tpl.event')
    },
    'social-link': {
        tab: 'text',
        fields: { qrText: t('tpl.socialUrl') },
        cta: t('tpl.social')
    },
    'feedback': {
        tab: 'text',
        fields: { qrText: t('tpl.feedbackUrl') },
        cta: t('tpl.feedback')
    }
};

document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
        const key = card.dataset.template;
        const tmpl = templates[key];
        if (!tmpl) return;

        // Switch tab
        const tabBtn = document.querySelector(`[data-tab="${tmpl.tab}"]`);
        if (tabBtn) tabBtn.click();

        // Fill fields
        for (const [id, value] of Object.entries(tmpl.fields)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'SELECT') el.value = value;
                else el.value = value;
            }
        }

        // Set CTA text
        const ctaEl = document.getElementById('ctaText');
        if (tmpl.cta && ctaEl) {
            ctaEl.value = tmpl.cta;
        }

        // Close the details
        const details = card.closest('details');
        if (details) details.removeAttribute('open');

        showToast(t('tpl.loaded', { name: card.querySelector('.template-name').textContent }), 'info');
    });
});

// DOM elementer
const qrText = document.getElementById('qrText');
const qrColor = document.getElementById('qrColor');
const bgColor = document.getElementById('bgColor');
const transparentBg = document.getElementById('transparentBg');
const qrSize = document.getElementById('qrSize');
const errorCorrection = document.getElementById('errorCorrection');
const fileFormat = document.getElementById('fileFormat');
const qrStyle = document.getElementById('qrStyle');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const printBtn = document.getElementById('printBtn');
const compareBtn = document.getElementById('compareBtn');
const qrPreview = document.getElementById('qrPreview');
const qrAnnouncement = document.getElementById('qrAnnouncement');
const ctaText = document.getElementById('ctaText');

// Batch elements
const batchInput = document.getElementById('batchInput');
const batchGenerateBtn = document.getElementById('batchGenerateBtn');

// History elements
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');

// Gem den genererede QR-kode canvas
let currentQRCanvas = null;
let currentQRSVG = null;

// Toast notification system
const toastContainer = document.getElementById('toastContainer');

function showToast(message, type = 'success', duration = 3000) {
    if (!toastContainer) return;
    const icons = { success: '\u2705', error: '\u274C', info: '\u2139\uFE0F' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || icons.info;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.replace('show', 'hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Generer logo QR-kode ved load
function generateLogoQR() {
    // Vent til qrcode er loaded
    if (typeof qrcode === 'undefined') {
        setTimeout(generateLogoQR, 100);
        return;
    }

    const logoSvg = document.getElementById('logoQR');
    if (!logoSvg) return; // Skip if logo element doesn't exist

    // Brug qrcode generator biblioteket
    const qr = qrcode(0, 'M');
    qr.addData('https://qrtool.dk');
    qr.make();

    const cells = qr.getModuleCount();
    const size = 100;
    const scale = size / cells;

    let path = '';
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            if (qr.isDark(y, x)) {
                const px = x * scale;
                const py = y * scale;
                path += `M${px},${py}h${scale}v${scale}h-${scale}z `;
            }
        }
    }

    logoSvg.innerHTML = `<path d="${path}" fill="url(#gradient)"/>
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
            </linearGradient>
        </defs>`;
}

// Start logo generation when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateLogoQR);
} else {
    generateLogoQR();
}

// Color swatch preview
const swatchFg = document.querySelector('.swatch-fg');
const swatchBg = document.querySelector('.swatch-bg');

function updateColorSwatches() {
    if (swatchFg) swatchFg.style.background = qrColor.value;
    if (swatchBg) swatchBg.style.background = bgColor.value;
}

// Opdater farveværdi display
qrColor.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = e.target.value;
    updateColorSwatches();
});

bgColor.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = e.target.value;
    updateColorSwatches();
});

// Swap colors button
const swapColorsBtn = document.getElementById('swapColors');
if (swapColorsBtn) {
    swapColorsBtn.addEventListener('click', () => {
        const temp = qrColor.value;
        qrColor.value = bgColor.value;
        bgColor.value = temp;
        qrColor.nextElementSibling.textContent = qrColor.value;
        bgColor.nextElementSibling.textContent = bgColor.value;
        updateColorSwatches();
        clearPresetActive();
        if (currentQRCanvas || currentQRSVG) generateQRCode();
    });
}

// Error Correction segmented control
const ecOptions = document.querySelectorAll('.ec-option');
const ecHint = document.getElementById('ecHint');
const ecHints = {
    L: t('ec.L'),
    M: t('ec.M'),
    Q: t('ec.Q'),
    H: t('ec.H')
};
ecOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        const val = opt.dataset.ec;
        if (errorCorrection) {
            errorCorrection.value = val;
            errorCorrection.dispatchEvent(new Event('change'));
        }
        ecOptions.forEach(o => {
            o.classList.remove('active');
            o.setAttribute('aria-pressed', 'false');
        });
        opt.classList.add('active');
        opt.setAttribute('aria-pressed', 'true');
        if (ecHint) ecHint.textContent = ecHints[val] || '';
    });
});

// QR Style preview cards
const styleCards = document.querySelectorAll('.style-preview-card');
styleCards.forEach(card => {
    card.addEventListener('click', () => {
        const style = card.dataset.style;
        if (qrStyle) {
            qrStyle.value = style;
            qrStyle.dispatchEvent(new Event('change'));
        }
        styleCards.forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');
    });
});

// Color presets
const colorPresets = document.querySelectorAll('.color-preset');
colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        const fg = preset.dataset.fg;
        const bg = preset.dataset.bg;
        qrColor.value = fg;
        bgColor.value = bg;
        qrColor.nextElementSibling.textContent = fg;
        bgColor.nextElementSibling.textContent = bg;
        updateColorSwatches();
        colorPresets.forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-pressed', 'false');
        });
        preset.classList.add('active');
        preset.setAttribute('aria-pressed', 'true');
        if (currentQRCanvas || currentQRSVG) generateQRCode();
    });
});

// Clear active preset when manually picking a color
function clearPresetActive() {
    colorPresets.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
    });
}
qrColor.addEventListener('input', clearPresetActive);
bgColor.addEventListener('input', clearPresetActive);

// Håndter transparent baggrund checkbox
transparentBg.addEventListener('change', (e) => {
    if (e.target.checked) {
        bgColor.disabled = true;
        bgColor.parentElement.style.opacity = '0.5';
        clearPresetActive();
        // Hvis JPG er valgt, skift til PNG
        if (fileFormat.value === 'jpg') {
            fileFormat.value = 'png';
        }
    } else {
        bgColor.disabled = false;
        bgColor.parentElement.style.opacity = '1';
    }
});

// ===========================================
// Logo Upload
// ===========================================

const logoDropzone = document.getElementById('logoDropzone');
const logoFileInput = document.getElementById('logoFileInput');
const logoDropzoneContent = document.getElementById('logoDropzoneContent');
const logoPreviewWrap = document.getElementById('logoPreviewWrap');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const logoRemoveBtn = document.getElementById('logoRemoveBtn');
const logoSizeInput = document.getElementById('logoSize');
const logoSizeValue = document.getElementById('logoSizeValue');
const logoSizeGroup = document.getElementById('logoSizeGroup');

let currentLogoImage = null; // Stores loaded Image object
let currentLogoObjectUrl = null;

if (logoDropzone) {
    // Click to browse
    logoDropzone.addEventListener('click', (e) => {
        if (e.target === logoRemoveBtn || e.target.closest('.logo-remove-btn')) return;
        logoFileInput.click();
    });

    // Drag events
    logoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        logoDropzone.classList.add('dragover');
    });
    logoDropzone.addEventListener('dragleave', (e) => {
        if (!logoDropzone.contains(e.relatedTarget)) {
            logoDropzone.classList.remove('dragover');
        }
    });
    logoDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        logoDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleLogoFile(file);
    });

    // File input change
    logoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleLogoFile(file);
    });

    // Remove logo
    logoRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeLogo();
    });

    // Logo size slider
    if (logoSizeInput) {
        logoSizeInput.addEventListener('input', () => {
            logoSizeValue.textContent = logoSizeInput.value;
            if (currentQRCanvas || currentQRSVG) generateQRCode();
        });
    }
}

function handleLogoFile(file) {
    if (currentLogoObjectUrl) {
        URL.revokeObjectURL(currentLogoObjectUrl);
        currentLogoObjectUrl = null;
    }
    const url = URL.createObjectURL(file);
    currentLogoObjectUrl = url;
    const img = new Image();
    img.onload = () => {
        currentLogoImage = img;
        logoPreviewImg.src = url;
        logoDropzoneContent.style.display = 'none';
        logoPreviewWrap.style.display = '';
        logoSizeGroup.style.display = '';

        // Auto-switch to high error correction for logo QR codes
        if (errorCorrection.value === 'L' || errorCorrection.value === 'M') {
            errorCorrection.value = 'H';
            showToast(t('toast.logoEcBoosted'), 'info');
        }

        if (currentQRCanvas || currentQRSVG) generateQRCode();
    };
    img.onerror = () => {
        URL.revokeObjectURL(url);
        currentLogoObjectUrl = null;
        showToast(t('toast.logoLoadError'), 'error');
    };
    img.src = url;
}

function removeLogo() {
    if (currentLogoObjectUrl) {
        URL.revokeObjectURL(currentLogoObjectUrl);
        currentLogoObjectUrl = null;
    }
    currentLogoImage = null;
    logoPreviewImg.src = '';
    logoDropzoneContent.style.display = '';
    logoPreviewWrap.style.display = 'none';
    logoSizeGroup.style.display = 'none';
    logoFileInput.value = '';
    if (currentQRCanvas || currentQRSVG) generateQRCode();
}

function drawCTAOnCanvas(canvas, qrSize) {
    const text = ctaText?.value.trim();
    if (!text) return;
    const ctx = canvas.getContext('2d');
    const fontSize = Math.max(16, qrSize * 0.06);
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = qrColor.value;
    const ctaY = qrSize + (canvas.height - qrSize) / 2;
    ctx.fillText(text, canvas.width / 2, ctaY);
}

function drawLogoOnCanvas(canvas) {
    if (!currentLogoImage) return;
    const ctx = canvas.getContext('2d');
    const sizePercent = parseInt(logoSizeInput?.value || 25) / 100;
    const logoW = canvas.width * sizePercent;
    const logoH = canvas.height * sizePercent;
    const x = (canvas.width - logoW) / 2;
    const y = (canvas.height - logoH) / 2;

    // White background behind logo for readability
    const padding = logoW * 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - padding, y - padding, logoW + padding * 2, logoH + padding * 2, logoW * 0.08);
    } else {
        ctx.rect(x - padding, y - padding, logoW + padding * 2, logoH + padding * 2);
    }
    ctx.fill();

    ctx.drawImage(currentLogoImage, x, y, logoW, logoH);
}

// Get QR data based on current tab
function getQRData() {
    switch (currentTab) {
        case 'text':
            return qrText.value.trim();

        case 'wifi':
            const ssid = document.getElementById('wifiSSID').value.trim();
            const password = document.getElementById('wifiPassword').value;
            const encryption = document.getElementById('wifiEncryption').value;
            const hidden = document.getElementById('wifiHidden').checked ? 'true' : 'false';

            if (!ssid) return null;

            // Escape special chars per WiFi QR spec
            const escWifi = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"');
            return `WIFI:T:${encryption};S:${escWifi(ssid)};P:${escWifi(password)};H:${hidden};;`;

        case 'vcard':
            const name = document.getElementById('vcardName').value.trim();
            const org = document.getElementById('vcardOrg').value.trim();
            const title = document.getElementById('vcardTitle').value.trim();
            const phone = document.getElementById('vcardPhone').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            const website = document.getElementById('vcardWebsite').value.trim();
            const address = document.getElementById('vcardAddress').value.trim();

            if (!name) return null;

            // vCard 3.0 format
            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            vcard += `FN:${name}\n`;
            if (org) vcard += `ORG:${org}\n`;
            if (title) vcard += `TITLE:${title}\n`;
            if (phone) vcard += `TEL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            if (website) vcard += `URL:${website}\n`;
            if (address) vcard += `ADR:;;${address}\n`;
            vcard += 'END:VCARD';

            return vcard;

        case 'email':
            const emailTo = document.getElementById('emailTo').value.trim();
            const subject = document.getElementById('emailSubject').value.trim();
            const body = document.getElementById('emailBody').value.trim();

            if (!emailTo) return null;

            return `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        case 'sms':
            const smsPhone = document.getElementById('smsPhone').value.trim();
            const smsMessage = document.getElementById('smsMessage').value.trim();

            if (!smsPhone) return null;

            return `sms:${smsPhone}?body=${encodeURIComponent(smsMessage)}`;

        case 'calendar':
            const calTitle = document.getElementById('calTitle').value.trim();
            const calLocation = document.getElementById('calLocation').value.trim();
            const calStart = document.getElementById('calStart').value;
            const calEnd = document.getElementById('calEnd').value;
            const calDescription = document.getElementById('calDescription').value.trim();

            if (!calTitle || !calStart) return null;

            // Convert to iCalendar format
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n';
            ical += `SUMMARY:${calTitle}\n`;
            if (calLocation) ical += `LOCATION:${calLocation}\n`;
            ical += `DTSTART:${formatDate(calStart)}\n`;
            if (calEnd) ical += `DTEND:${formatDate(calEnd)}\n`;
            if (calDescription) ical += `DESCRIPTION:${calDescription}\n`;
            ical += 'END:VEVENT\nEND:VCALENDAR';

            return ical;

        case 'geo':
            const geoLat = parseFloat(document.getElementById('geoLat').value.trim());
            const geoLng = parseFloat(document.getElementById('geoLng').value.trim());
            const geoLabel = document.getElementById('geoLabel').value.trim();

            if (isNaN(geoLat) || isNaN(geoLng)) return null;

            if (geoLabel) {
                return `geo:0,0?q=${geoLat},${geoLng}(${encodeURIComponent(geoLabel)})`;
            }
            return `geo:${geoLat},${geoLng}`;

        case 'payment':
            const paymentType = document.getElementById('paymentType').value;
            if (paymentType === 'paypal') {
                const username = document.getElementById('paypalUsername').value.trim();
                if (!username) return null;
                const amount = document.getElementById('paypalAmount').value.trim();
                let url = `https://paypal.me/${username}`;
                if (amount && parseFloat(amount) > 0) url += `/${amount}`;
                return url;
            } else {
                const phone = document.getElementById('mobilepayPhone').value.trim();
                if (!phone) return null;
                const amount = document.getElementById('mobilepayAmount').value.trim();
                const comment = document.getElementById('mobilepayComment').value.trim();
                let params = `phone=${encodeURIComponent(phone)}`;
                if (amount && parseFloat(amount) > 0) params += `&amount=${amount}`;
                if (comment) params += `&comment=${encodeURIComponent(comment)}`;
                return `mobilepay://send?${params}`;
            }

        case 'social':
            const socialPlatform = document.getElementById('socialPlatform').value;
            const socialUsername = document.getElementById('socialUsername').value.trim();
            if (!socialUsername) return null;

            const socialUrls = {
                instagram: `https://instagram.com/${socialUsername}`,
                facebook: `https://facebook.com/${socialUsername}`,
                linkedin: `https://linkedin.com/in/${socialUsername}`,
                tiktok: `https://tiktok.com/@${socialUsername}`,
                youtube: `https://youtube.com/@${socialUsername}`,
                x: `https://x.com/${socialUsername}`,
                snapchat: `https://snapchat.com/add/${socialUsername}`,
                github: `https://github.com/${socialUsername}`
            };
            return socialUrls[socialPlatform] || null;

        default:
            return null;
    }
}

// ===========================================
// Inline Form Validation
// ===========================================

function setFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + 'Error');
    const field = document.getElementById(fieldId);
    if (!errorEl || !field) return;
    const group = field.closest('.form-group');
    if (message) {
        errorEl.textContent = message;
        if (group) group.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', fieldId + 'Error');
    } else {
        errorEl.textContent = '';
        if (group) group.classList.remove('has-error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    }
}

function clearAllErrors() {
    document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
    document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; });
}

function validateForm() {
    clearAllErrors();
    let valid = true;

    switch (currentTab) {
        case 'text': {
            const val = qrText.value.trim();
            if (!val) {
                setFieldError('qrText', t('err.textRequired'));
                valid = false;
            }
            break;
        }
        case 'wifi': {
            const ssid = document.getElementById('wifiSSID').value.trim();
            if (!ssid) {
                setFieldError('wifiSSID', t('err.ssidRequired'));
                valid = false;
            }
            break;
        }
        case 'vcard': {
            const name = document.getElementById('vcardName').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            const website = document.getElementById('vcardWebsite').value.trim();
            if (!name) {
                setFieldError('vcardName', t('err.nameRequired'));
                valid = false;
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setFieldError('vcardEmail', t('err.invalidEmail'));
                valid = false;
            }
            if (website && !/^https?:\/\/.+/.test(website)) {
                setFieldError('vcardWebsite', t('err.urlHttps'));
                valid = false;
            }
            break;
        }
        case 'email': {
            const to = document.getElementById('emailTo').value.trim();
            if (!to) {
                setFieldError('emailTo', t('err.emailRequired'));
                valid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                setFieldError('emailTo', t('err.invalidEmail'));
                valid = false;
            }
            break;
        }
        case 'sms': {
            const phone = document.getElementById('smsPhone').value.trim();
            if (!phone) {
                setFieldError('smsPhone', t('err.phoneRequired'));
                valid = false;
            }
            break;
        }
        case 'calendar': {
            const title = document.getElementById('calTitle').value.trim();
            const start = document.getElementById('calStart').value;
            if (!title) {
                setFieldError('calTitle', t('err.eventNameRequired'));
                valid = false;
            }
            if (!start) {
                setFieldError('calStart', t('err.startDateRequired'));
                valid = false;
            }
            break;
        }
        case 'geo': {
            const latStr = document.getElementById('geoLat').value.trim();
            const lngStr = document.getElementById('geoLng').value.trim();
            const latNum = parseFloat(latStr);
            const lngNum = parseFloat(lngStr);
            if (!latStr) {
                setFieldError('geoLat', t('err.latRequired'));
                valid = false;
            } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
                setFieldError('geoLat', t('err.latRange'));
                valid = false;
            }
            if (!lngStr) {
                setFieldError('geoLng', t('err.lngRequired'));
                valid = false;
            } else if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
                setFieldError('geoLng', t('err.lngRange'));
                valid = false;
            }
            break;
        }
        case 'social': {
            const sUser = document.getElementById('socialUsername').value.trim();
            if (!sUser) {
                setFieldError('socialUsername', t('err.usernameRequired'));
                valid = false;
            }
            break;
        }
        case 'payment': {
            const pType = document.getElementById('paymentType').value;
            if (pType === 'paypal') {
                const usr = document.getElementById('paypalUsername').value.trim();
                if (!usr) {
                    setFieldError('paypalUsername', t('err.paypalRequired'));
                    valid = false;
                }
            } else {
                const ph = document.getElementById('mobilepayPhone').value.trim();
                if (!ph) {
                    setFieldError('mobilepayPhone', t('err.mobilepayRequired'));
                    valid = false;
                }
            }
            break;
        }
    }
    return valid;
}

// Clear errors on input/change
['input', 'change'].forEach(eventType => {
    document.addEventListener(eventType, (e) => {
        const field = e.target;
        if (field.id && document.getElementById(field.id + 'Error')) {
            setFieldError(field.id, '');
        }
    });
});

// Clear errors on tab switch
tabButtons.forEach(button => {
    button.addEventListener('click', clearAllErrors);
});

// Generer QR-kode (with null check for button)
if (generateBtn) {
    generateBtn.addEventListener('click', generateQRCode);
}

function generateQRCode() {
    if (!validateForm()) return;
    const text = getQRData();

    if (!text) return;

    try {
        // Fjern eksisterende QR-kode
        qrPreview.innerHTML = '';

        const size = parseInt(qrSize.value);
        const format = fileFormat.value;
        const ecLevel = errorCorrection.value;
        const style = qrStyle.value;

        // Generer QR-kode med qrcode biblioteket
        const typeNumber = 0; // Auto-detect
        const qr = qrcode(typeNumber, ecLevel);
        qr.addData(text);
        qr.make();

        const hasCTA = ctaText && ctaText.value.trim();
        const needsCanvas = currentLogoImage || hasCTA;

        if (format === 'svg' && !needsCanvas) {
            // Generer SVG (kun uden logo/CTA — de kræver canvas)
            currentQRSVG = toSvgString(qr, 2, style);
            qrPreview.innerHTML = currentQRSVG;
            currentQRCanvas = null;
        } else {
            // Generer Canvas
            const canvas = document.createElement('canvas');
            const ctaExtra = hasCTA ? Math.max(40, size * 0.1) : 0;
            canvas.width = size;
            canvas.height = size + ctaExtra;
            drawCanvas(qr, size, canvas, style);
            drawLogoOnCanvas(canvas);
            if (hasCTA) drawCTAOnCanvas(canvas, size);
            qrPreview.appendChild(canvas);
            currentQRCanvas = canvas;
            currentQRSVG = null;
        }

        // Aktiver download, kopiér og del knapper
        downloadBtn.disabled = false;
        if (copyBtn) copyBtn.disabled = false;
        if (shareBtn) shareBtn.disabled = false;
        if (printBtn) printBtn.disabled = false;
        if (compareBtn) compareBtn.disabled = false;

        // Save to history
        saveToHistory(text, currentTab);

        // Focus preview for keyboard users
        qrPreview.setAttribute('tabindex', '-1');
        qrPreview.focus({ preventScroll: true });

        // Announce to screen readers
        if (qrAnnouncement) {
            const label = t('type.' + currentTab) || currentTab;
            const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
            qrAnnouncement.textContent = t('aria.qrGenerated', { type: label, preview });
        }

        showToast(t('toast.generated'), 'success');

    } catch (error) {
        console.error('Fejl ved generering af QR-kode:', error);
        showToast(t('toast.generateError') + error.message, 'error');
    }
}

// Hjælpefunktion til at tegne QR-kode på canvas
function drawCanvas(qr, size, canvas, style = 'square') {
    const cells = qr.getModuleCount();
    const scale = size / cells;

    // Set dimensions only if not already set (CTA may extend height)
    if (!canvas.width || canvas.width < size) canvas.width = size;
    if (!canvas.height || canvas.height < size) canvas.height = size;

    const ctx = canvas.getContext('2d');

    // Fyld baggrund (hele canvas inkl. CTA-område)
    if (!transparentBg.checked) {
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Tegn QR-kode baseret på stil
    ctx.fillStyle = qrColor.value;

    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            if (qr.isDark(y, x)) {
                const px = x * scale;
                const py = y * scale;

                if (style === 'dots') {
                    // Tegn cirkler
                    ctx.beginPath();
                    ctx.arc(px + scale/2, py + scale/2, scale/2, 0, 2 * Math.PI);
                    ctx.fill();
                } else if (style === 'rounded') {
                    // Tegn afrundede firkanter
                    const radius = scale * 0.3;
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(px, py, scale, scale, radius);
                    } else {
                        ctx.rect(px, py, scale, scale);
                    }
                    ctx.fill();
                } else {
                    // Standard firkanter
                    ctx.fillRect(px, py, scale, scale);
                }
            }
        }
    }
}

// Hjælpefunktion til at generere SVG
function toSvgString(qr, border, style = 'square') {
    const cells = qr.getModuleCount();
    const size = cells + border * 2;

    let parts = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" stroke="none">`);

    // Baggrund (kun hvis ikke transparent)
    if (!transparentBg.checked) {
        parts.push(`<rect width="100%" height="100%" fill="${bgColor.value}"/>`);
    }

    if (style === 'dots') {
        // Circles for dots style
        for (let y = 0; y < cells; y++) {
            for (let x = 0; x < cells; x++) {
                if (qr.isDark(y, x)) {
                    const cx = x + border + 0.5;
                    const cy = y + border + 0.5;
                    parts.push(`<circle cx="${cx}" cy="${cy}" r="0.5" fill="${qrColor.value}"/>`);
                }
            }
        }
    } else if (style === 'rounded') {
        // Rounded rectangles
        for (let y = 0; y < cells; y++) {
            for (let x = 0; x < cells; x++) {
                if (qr.isDark(y, x)) {
                    const px = x + border;
                    const py = y + border;
                    parts.push(`<rect x="${px}" y="${py}" width="1" height="1" rx="0.3" fill="${qrColor.value}"/>`);
                }
            }
        }
    } else {
        // Standard squares
        parts.push(`<path d="`);
        for (let y = 0; y < cells; y++) {
            for (let x = 0; x < cells; x++) {
                if (qr.isDark(y, x)) {
                    const px = x + border;
                    const py = y + border;
                    parts.push(`M${px},${py}h1v1h-1z`);
                }
            }
        }
        parts.push(`" fill="${qrColor.value}"/>`);
    }

    parts.push(`</svg>`);

    return parts.join('\n');
}

// Download QR-kode (with null check)
if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadQRCode);
}

function downloadQRCode() {
    const format = fileFormat.value;
    const filename = `qr-code-${Date.now()}.${format}`;

    try {
        if (format === 'svg') {
            // Download SVG
            if (!currentQRSVG) {
                showToast(t('toast.generateFirst'), 'info');
                return;
            }

            const blob = new Blob([currentQRSVG], { type: 'image/svg+xml;charset=utf-8' });
            downloadBlob(blob, filename);

        } else if (format === 'png') {
            // Download PNG
            if (!currentQRCanvas) {
                showToast(t('toast.generateFirst'), 'info');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                downloadBlob(blob, filename);
            }, 'image/png');

        } else if (format === 'jpg') {
            // Download JPG
            if (!currentQRCanvas) {
                showToast(t('toast.generateFirst'), 'info');
                return;
            }

            // For JPG skal vi sørge for hvid baggrund hvis transparent er valgt
            if (transparentBg.checked) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = currentQRCanvas.width;
                tempCanvas.height = currentQRCanvas.height;
                const ctx = tempCanvas.getContext('2d');

                // Fyld med hvid baggrund
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // Tegn QR-kode ovenpå
                ctx.drawImage(currentQRCanvas, 0, 0);

                tempCanvas.toBlob((blob) => {
                    downloadBlob(blob, filename);
                }, 'image/jpeg', 0.95);
            } else {
                currentQRCanvas.toBlob((blob) => {
                    downloadBlob(blob, filename);
                }, 'image/jpeg', 0.95);
            }

        } else if (format === 'webp') {
            // Download WebP
            if (!currentQRCanvas) {
                showToast(t('toast.generateFirst'), 'info');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                if (!blob) {
                    showToast(t('toast.webpUnsupported'), 'error');
                    return;
                }
                downloadBlob(blob, filename);
            }, 'image/webp', 0.95);

        } else if (format === 'pdf') {
            // Download PDF (A4)
            if (!currentQRCanvas) {
                showToast(t('toast.generateFirst'), 'info');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                if (!blob) return;
                blob.arrayBuffer().then(buf => {
                    const pdfBlob = buildPDF(new Uint8Array(buf), currentQRCanvas.width, currentQRCanvas.height);
                    downloadBlob(pdfBlob, `qr-code-${Date.now()}.pdf`);
                });
            }, 'image/jpeg', 0.95);
        }

        showToast(t('toast.downloaded'), 'success');

    } catch (error) {
        console.error('Fejl ved download:', error);
        showToast(t('toast.downloadError') + error.message, 'error');
    }
}

// Build a minimal PDF with a centered JPEG image on A4
function buildPDF(jpegBytes, imgW, imgH) {
    const pageW = 595.28, pageH = 841.89;
    const maxDim = 400;
    const scale = Math.min(maxDim / imgW, maxDim / imgH);
    const w = Math.round(imgW * scale);
    const h = Math.round(imgH * scale);
    const x = Math.round((pageW - w) / 2);
    const y = Math.round((pageH - h) / 2);

    const objs = [];
    const offsets = [];
    let pos = 0;

    function add(s) { const b = new TextEncoder().encode(s); objs.push(b); pos += b.length; return b; }
    function addObj(n, s) { offsets[n] = pos; return add(`${n} 0 obj\n${s}\nendobj\n`); }

    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`);

    const stream = `q ${w} 0 0 ${h} ${x} ${y} cm /Im0 Do Q`;
    addObj(4, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);

    // Image object header (binary stream follows)
    const imgHead = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
    const imgTail = '\nendstream\nendobj\n';
    offsets[5] = pos;
    objs.push(new TextEncoder().encode(imgHead));
    pos += imgHead.length;
    objs.push(jpegBytes);
    pos += jpegBytes.length;
    objs.push(new TextEncoder().encode(imgTail));
    pos += imgTail.length;

    const xrefPos = pos;
    add(`xref\n0 6\n0000000000 65535 f \n`);
    for (let i = 1; i <= 5; i++) {
        add(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

    return new Blob(objs, { type: 'application/pdf' });
}

// Hjælpefunktion til at downloade blob
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Kopiér QR-kode til clipboard
if (copyBtn) {
    copyBtn.addEventListener('click', copyQRCode);
}

async function copyQRCode() {
    // Tjek om Clipboard API er tilgængelig
    if (!navigator.clipboard?.write) {
        showToast(t('toast.copyUnsupported'), 'error');
        return;
    }

    try {
        let canvas = currentQRCanvas;

        // Hvis SVG: render til et midlertidigt canvas
        if (!canvas && currentQRSVG) {
            canvas = await svgToCanvas(currentQRSVG);
        }

        if (!canvas) {
            showToast(t('toast.generateFirst'), 'info');
            return;
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            showToast(t('toast.blobError'), 'error');
            return;
        }

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);

        showToast(t('toast.copied'), 'success');

    } catch (error) {
        console.error('Fejl ved kopiering:', error);
        showToast(t('toast.copyError'), 'error');
    }
}

// Print QR-kode
if (printBtn) {
    printBtn.addEventListener('click', () => {
        if (!currentQRCanvas && !currentQRSVG) {
            showToast(t('toast.generateFirst'), 'info');
            return;
        }
        window.print();
    });
}

// Compare QR styles
if (compareBtn) {
    compareBtn.addEventListener('click', () => {
        const text = getQRData();
        if (!text) {
            showToast(t('toast.generateFirst'), 'info');
            return;
        }

        const compareSection = document.getElementById('compareSection');
        const compareGrid = document.getElementById('compareGrid');
        if (!compareSection || !compareGrid) return;

        const ecLevel = errorCorrection.value;
        const styles = [
            { key: 'square', label: t('style.square') },
            { key: 'rounded', label: t('style.rounded') },
            { key: 'dots', label: t('style.dots') }
        ];

        compareGrid.innerHTML = '';
        const compSize = 200;

        styles.forEach(({ key, label }) => {
            const qr = qrcode(0, ecLevel);
            qr.addData(text);
            qr.make();

            const canvas = document.createElement('canvas');
            canvas.width = compSize;
            canvas.height = compSize;
            drawCanvas(qr, compSize, canvas, key);

            const item = document.createElement('div');
            item.className = 'compare-item';
            item.appendChild(canvas);

            const labelEl = document.createElement('div');
            labelEl.className = 'compare-item-label';
            labelEl.textContent = label;
            item.appendChild(labelEl);

            compareGrid.appendChild(item);
        });

        compareSection.style.display = '';
        compareSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

// Del QR-kode via Web Share API
if (shareBtn) {
    shareBtn.addEventListener('click', shareQRCode);
}

async function shareQRCode() {
    if (!navigator.share) {
        showToast(t('toast.shareUnsupported'), 'info');
        return;
    }

    try {
        let canvas = currentQRCanvas;
        if (!canvas && currentQRSVG) {
            canvas = await svgToCanvas(currentQRSVG);
        }
        if (!canvas) {
            showToast(t('toast.generateFirst'), 'info');
            return;
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            showToast(t('toast.shareImageError'), 'error');
            return;
        }

        const file = new File([blob], t('share.filename'), { type: 'image/png' });

        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            showToast(t('toast.shareImageUnsupported'), 'info');
            return;
        }

        await navigator.share({
            title: t('share.title'),
            files: [file]
        });

        showToast(t('toast.shared'), 'success');
    } catch (error) {
        // User cancelled the share dialog — not an error
        if (error.name !== 'AbortError') {
            console.error('Fejl ved deling:', error);
            showToast(t('toast.shareError'), 'error');
        }
    }
}

// Hjælpefunktion: konverter SVG-streng til canvas
function svgToCanvas(svgString) {
    return new Promise((resolve, reject) => {
        const size = parseInt(qrSize.value);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Tilføj eksplicit width/height til SVG for korrekt rasterisering
        const sizedSvg = svgString.replace(
            /<svg([^>]*)>/,
            `<svg$1 width="${size}" height="${size}">`
        );
        const blob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(canvas);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('SVG-billede kunne ikke indlæses'));
        };
        img.src = url;
    });
}

// Batch generation
const batchPreviewBtn = document.getElementById('batchPreviewBtn');
const batchProgress = document.getElementById('batchProgress');
const batchProgressFill = document.getElementById('batchProgressFill');
const batchProgressText = document.getElementById('batchProgressText');
const batchPreviewGrid = document.getElementById('batchPreviewGrid');

function getBatchLines() {
    if (!batchInput) return [];
    return batchInput.value.trim().split('\n').filter(line => line.trim());
}

function updateBatchProgress(current, total) {
    if (!batchProgress) return;
    batchProgress.style.display = 'flex';
    const pct = Math.round((current / total) * 100);
    if (batchProgressFill) batchProgressFill.style.width = pct + '%';
    if (batchProgressText) batchProgressText.textContent = `${current}/${total}`;
}

function hideBatchProgress() {
    if (batchProgress) batchProgress.style.display = 'none';
    if (batchProgressFill) batchProgressFill.style.width = '0%';
}

// Preview batch QR codes
if (batchPreviewBtn && batchInput) {
    batchPreviewBtn.addEventListener('click', () => {
        const lines = getBatchLines();
        if (lines.length === 0) {
            showToast(t('batch.enterText'), 'error');
            return;
        }
        if (lines.length > 100) {
            showToast(t('batch.max100'), 'error');
            return;
        }

        const ecLevel = errorCorrection.value;
        const style = qrStyle.value;
        if (batchPreviewGrid) batchPreviewGrid.innerHTML = '';

        lines.forEach((text, i) => {
            const qr = qrcode(0, ecLevel);
            qr.addData(text);
            qr.make();

            const item = document.createElement('div');
            item.className = 'batch-preview-item';
            item.title = text;

            const previewCanvas = document.createElement('canvas');
            drawCanvas(qr, 128, previewCanvas, style);
            item.appendChild(previewCanvas);

            const label = document.createElement('div');
            label.className = 'batch-preview-label';
            label.textContent = `${i + 1}. ${text.length > 20 ? text.substring(0, 20) + '...' : text}`;
            item.appendChild(label);

            if (batchPreviewGrid) batchPreviewGrid.appendChild(item);
        });

        showToast(t('batch.preview', { n: lines.length }), 'success');
    });
}

// Generate batch with progress bar
if (batchGenerateBtn && batchInput) {
    batchGenerateBtn.addEventListener('click', async () => {
        const lines = getBatchLines();

        if (lines.length === 0) {
            showToast(t('batch.enterText'), 'error');
            return;
        }

        if (lines.length > 100) {
            showToast(t('batch.max100'), 'error');
            return;
        }

        if (typeof JSZip === 'undefined') {
            showToast(t('batch.jszipMissing'), 'error');
            return;
        }

        const originalText = batchGenerateBtn.textContent;
        batchGenerateBtn.textContent = t('batch.generating');
        batchGenerateBtn.disabled = true;

        try {
            const zip = new JSZip();
            const size = parseInt(qrSize.value);
            const format = fileFormat.value;
            const ecLevel = errorCorrection.value;
            const style = qrStyle.value;

            for (let i = 0; i < lines.length; i++) {
                const text = lines[i];
                const qr = qrcode(0, ecLevel);
                qr.addData(text);
                qr.make();

                if (format === 'svg') {
                    const svg = toSvgString(qr, 2, style);
                    zip.file(`qr-${i + 1}.svg`, svg);
                } else {
                    const canvas = document.createElement('canvas');
                    drawCanvas(qr, size, canvas, style);
                    const blob = await new Promise(resolve => {
                        canvas.toBlob(resolve, `image/${format}`, 0.95);
                    });
                    zip.file(`qr-${i + 1}.${format}`, blob);
                }

                updateBatchProgress(i + 1, lines.length);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(zipBlob, `qr-codes-${Date.now()}.zip`);

            showToast(t('batch.downloaded', { n: lines.length }), 'success');
            batchGenerateBtn.textContent = originalText;
            batchGenerateBtn.disabled = false;
            hideBatchProgress();

        } catch (error) {
            console.error('Fejl ved batch generering:', error);
            showToast(t('batch.error') + error.message, 'error');
            batchGenerateBtn.textContent = originalText;
            batchGenerateBtn.disabled = false;
            hideBatchProgress();
        }
    });
}

// CSV Import for batch generation
const csvFileInput = document.getElementById('csvFileInput');
if (csvFileInput) {
    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (lines.length === 0) {
                showToast(t('csv.empty'), 'error');
                return;
            }

            // Detect delimiter: comma, semicolon, or tab
            const firstLine = lines[0];
            const delim = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

            // Check if first line looks like a header
            const firstCell = firstLine.split(delim)[0].trim().replace(/^["']|["']$/g, '');
            const startsAt = /^(url|link|text|data|indhold|tekst|qr)/i.test(firstCell) ? 1 : 0;

            const values = [];
            for (let i = startsAt; i < lines.length; i++) {
                const cell = lines[i].split(delim)[0].trim().replace(/^["']|["']$/g, '');
                if (cell) values.push(cell);
            }

            if (values.length === 0) {
                showToast(t('csv.noData'), 'error');
                return;
            }

            if (batchInput) {
                batchInput.value = values.join('\n');
            }

            showToast(t('csv.imported', { n: values.length }), 'success');
            csvFileInput.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    });
}

// History management
const historyControls = document.getElementById('historyControls');
const historySearch = document.getElementById('historySearch');
const historyFilter = document.getElementById('historyFilter');

const typeLabels = {
    'text': t('type.text'),
    'wifi': t('type.wifi'),
    'vcard': t('type.vcard'),
    'email': t('type.email'),
    'sms': t('type.sms'),
    'calendar': t('type.calendar'),
    'geo': t('type.geo'),
    'payment': t('type.payment'),
    'social': t('type.social')
};

function saveToHistory(text, type) {
    const history = getHistory();
    const entry = {
        text: text.substring(0, 200),
        type: type,
        label: '',
        timestamp: Date.now()
    };

    // Add to beginning, keep max 20 non-favorite entries (favorites always kept)
    history.unshift(entry);
    const nonFavs = history.filter(e => !e.favorite);
    if (nonFavs.length > 20) {
        const oldest = nonFavs[nonFavs.length - 1];
        const idx = history.indexOf(oldest);
        if (idx !== -1) history.splice(idx, 1);
    }

    localStorage.setItem('qr-history', JSON.stringify(history));
    renderHistory();
}

function getHistory() {
    try {
        const stored = localStorage.getItem('qr-history');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function renderHistory() {
    const history = getHistory();
    const search = historySearch ? historySearch.value.toLowerCase() : '';
    const filter = historyFilter ? historyFilter.value : 'all';

    if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">' + t('history.empty') + '</p>';
        clearHistory.style.display = 'none';
        if (historyControls) historyControls.style.display = 'none';
        return;
    }

    clearHistory.style.display = 'block';
    if (historyControls) historyControls.style.display = 'flex';

    // Filter and search
    const filtered = history
        .map((entry, index) => ({ ...entry, type: entry.type || 'text', originalIndex: index }))
        .filter(entry => {
            if (filter === 'favorites' && !entry.favorite) return false;
            if (filter !== 'all' && filter !== 'favorites' && entry.type !== filter) return false;
            if (search) {
                const haystack = ((entry.label || '') + ' ' + entry.text + ' ' + (typeLabels[entry.type] || '')).toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        });

    historyList.innerHTML = '';

    if (filtered.length === 0) {
        historyList.innerHTML = '<p class="history-empty">' + t('history.noResults') + '</p>';
        return;
    }

    filtered.forEach((entry) => {
        const date = new Date(entry.timestamp);

        const item = document.createElement('div');
        item.className = 'history-item' + (entry.favorite ? ' history-item-favorite' : '');

        const info = document.createElement('div');
        info.className = 'history-item-info';

        const textDiv = document.createElement('div');
        textDiv.className = 'history-item-text';

        // Type badge
        const badge = document.createElement('span');
        badge.className = `history-type-badge badge-${entry.type}`;
        badge.textContent = typeLabels[entry.type] || entry.type;
        textDiv.appendChild(badge);
        textDiv.appendChild(document.createTextNode(entry.text));

        // Label (editable name)
        if (entry.label) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'history-item-label';
            labelDiv.textContent = entry.label;
            info.appendChild(textDiv);
            info.appendChild(labelDiv);
        } else {
            info.appendChild(textDiv);
        }

        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-item-date';
        dateDiv.textContent = date.toLocaleString(t('history.dateLocale'));
        info.appendChild(dateDiv);

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        // Favorite toggle
        const favBtn = document.createElement('button');
        favBtn.className = 'btn-history-action';
        favBtn.title = entry.favorite ? t('aria.removeFavTitle') : t('aria.addFavTitle');
        favBtn.innerHTML = entry.favorite
            ? '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
            : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        favBtn.setAttribute('aria-label', entry.favorite ? t('aria.removeFav') : t('aria.addFav'));
        favBtn.addEventListener('click', () => toggleFavorite(entry.originalIndex));

        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn-history-action';
        renameBtn.title = t('aria.renameTitle');
        renameBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
        renameBtn.setAttribute('aria-label', t('aria.rename'));
        renameBtn.addEventListener('click', () => renameHistoryEntry(entry.originalIndex));

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn-history-action';
        loadBtn.title = t('aria.reloadTitle');
        loadBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
        loadBtn.setAttribute('aria-label', t('aria.reload'));
        loadBtn.addEventListener('click', () => loadFromHistory(entry.originalIndex));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-history-action';
        deleteBtn.title = t('aria.deleteTitle');
        deleteBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        deleteBtn.setAttribute('aria-label', t('aria.delete'));
        deleteBtn.addEventListener('click', () => deleteFromHistory(entry.originalIndex));

        actions.appendChild(favBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(loadBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);
        historyList.appendChild(item);
    });
}

function loadFromHistory(index) {
    const history = getHistory();
    const entry = history[index];

    if (!entry) return;

    // Switch to correct tab
    const targetTab = entry.type;
    const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
    if (tabButton) {
        tabButton.click();
    }

    // Restore field values based on tab type
    if (targetTab === 'text' && qrText) {
        qrText.value = entry.text;
    } else if (targetTab === 'geo') {
        const geoMatch = entry.text.match(/geo:(?:0,0\?q=)?([-\d.]+),([-\d.]+)/);
        if (geoMatch) {
            document.getElementById('geoLat').value = geoMatch[1];
            document.getElementById('geoLng').value = geoMatch[2];
        }
    }

    // Generate QR code
    setTimeout(() => generateQRCode(), 100);
}

function toggleFavorite(index) {
    const history = getHistory();
    const entry = history[index];
    if (!entry) return;
    entry.favorite = !entry.favorite;
    localStorage.setItem('qr-history', JSON.stringify(history));
    renderHistory();
    showToast(entry.favorite ? t('history.addedFav') : t('history.removedFav'), 'success');
}

function deleteFromHistory(index) {
    const history = getHistory();
    history.splice(index, 1);
    localStorage.setItem('qr-history', JSON.stringify(history));
    renderHistory();
}

function renameHistoryEntry(index) {
    const history = getHistory();
    const entry = history[index];
    if (!entry) return;
    const name = prompt(t('history.rename'), entry.label || '');
    if (name === null) return; // Cancelled
    entry.label = name.trim();
    localStorage.setItem('qr-history', JSON.stringify(history));
    renderHistory();
}

// Search and filter listeners
if (historySearch) {
    let historySearchTimer;
    historySearch.addEventListener('input', () => {
        clearTimeout(historySearchTimer);
        historySearchTimer = setTimeout(renderHistory, 200);
    });
}
if (historyFilter) {
    historyFilter.addEventListener('change', renderHistory);
}

// Clear history button (with null check)
if (clearHistory) {
    clearHistory.addEventListener('click', () => {
        if (confirm(t('history.confirmClear'))) {
            localStorage.removeItem('qr-history');
            renderHistory();
        }
    });
}

// Load history on page load (with null check)
if (historyList) {
    renderHistory();
}

// Generer automatisk når der indtastes (med debounce)
let debounceTimer;
if (qrText) {
    qrText.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        if (qrText.value.trim()) {
            debounceTimer = setTimeout(() => {
                generateQRCode();
            }, 1000);
        }
    });

    // Keyboard shortcut: Enter til at generere
    qrText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQRCode();
        }
    });
}

// Generer automatisk ved ændring af indstillinger
[qrColor, bgColor, qrSize, errorCorrection, fileFormat, qrStyle, ctaText].forEach(element => {
    if (element) {
        element.addEventListener('change', () => {
            if (currentQRCanvas || currentQRSVG) {
                generateQRCode();
            }
        });
    }
});

if (transparentBg) {
    transparentBg.addEventListener('change', () => {
        if (currentQRCanvas || currentQRSVG) {
            generateQRCode();
        }
    });
}

// ===========================================
// Geo Location - Use my location button
// ===========================================
const geoLocateBtn = document.getElementById('geoLocateBtn');
if (geoLocateBtn) {
    geoLocateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast(t('geo.unsupported'), 'error');
            return;
        }
        geoLocateBtn.disabled = true;
        geoLocateBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t('geo.fetching');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('geoLat').value = pos.coords.latitude.toFixed(6);
                document.getElementById('geoLng').value = pos.coords.longitude.toFixed(6);
                geoLocateBtn.disabled = false;
                geoLocateBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t('geo.useMyLocation');
                showToast(t('geo.fetched'), 'success');
            },
            (err) => {
                geoLocateBtn.disabled = false;
                geoLocateBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ' + t('geo.useMyLocation');
                const msgs = { 1: t('geo.denied'), 2: t('geo.unavailable'), 3: t('geo.timeout') };
                showToast(msgs[err.code] || t('geo.error'), 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
}

// ===========================================
// Social media URL preview
// ===========================================
const socialPlatform = document.getElementById('socialPlatform');
const socialUsername = document.getElementById('socialUsername');
const socialPreviewUrl = document.getElementById('socialPreviewUrl');

function updateSocialPreview() {
    if (!socialPlatform || !socialUsername || !socialPreviewUrl) return;
    const user = socialUsername.value.trim();
    if (!user) { socialPreviewUrl.textContent = ''; return; }
    const urls = {
        instagram: `instagram.com/${user}`,
        facebook: `facebook.com/${user}`,
        linkedin: `linkedin.com/in/${user}`,
        tiktok: `tiktok.com/@${user}`,
        youtube: `youtube.com/@${user}`,
        x: `x.com/${user}`,
        snapchat: `snapchat.com/add/${user}`,
        github: `github.com/${user}`
    };
    socialPreviewUrl.textContent = urls[socialPlatform.value] || '';
}

if (socialPlatform) socialPlatform.addEventListener('change', updateSocialPreview);
if (socialUsername) socialUsername.addEventListener('input', updateSocialPreview);

// ===========================================
// Payment type toggle (PayPal / MobilePay)
// ===========================================
const paymentTypeSelect = document.getElementById('paymentType');
if (paymentTypeSelect) {
    paymentTypeSelect.addEventListener('change', () => {
        const paypalFields = document.getElementById('paypalFields');
        const mobilepayFields = document.getElementById('mobilepayFields');
        if (paymentTypeSelect.value === 'paypal') {
            if (paypalFields) paypalFields.style.display = '';
            if (mobilepayFields) mobilepayFields.style.display = 'none';
        } else {
            if (paypalFields) paypalFields.style.display = 'none';
            if (mobilepayFields) mobilepayFields.style.display = '';
        }
        clearAllErrors();
    });
}

// ===========================================
// QR Scanner
// ===========================================

const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const scannerVideo = document.getElementById('scannerVideo');
const scannerCanvas = document.getElementById('scannerCanvas');
const scannerViewport = document.getElementById('scannerViewport');
const scanResult = document.getElementById('scanResult');
const scanResultText = document.getElementById('scanResultText');
const scanCopyBtn = document.getElementById('scanCopyBtn');
const scanOpenLink = document.getElementById('scanOpenLink');
const scanFileInput = document.getElementById('scanFileInput');

let scannerStream = null;
let scannerAnimationId = null;

// Start kamera-scanning
if (startScanBtn) {
    startScanBtn.addEventListener('click', startScanner);
}

async function startScanner() {
    if (typeof jsQR === 'undefined') {
        showToast(t('scanner.libMissing'), 'error');
        return;
    }

    try {
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        scannerVideo.srcObject = scannerStream;
        await scannerVideo.play();
        scannerViewport.style.display = 'block';
        startScanBtn.style.display = 'none';
        scanResult.style.display = 'none';
        scanFrame();
    } catch (error) {
        console.error('Kamera fejl:', error);
        if (error.name === 'NotAllowedError') {
            showToast(t('scanner.camDenied'), 'error');
        } else {
            showToast(t('scanner.camError'), 'error');
        }
    }
}

function scanFrame() {
    if (!scannerStream) return;

    const video = scannerVideo;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        scannerAnimationId = requestAnimationFrame(scanFrame);
        return;
    }

    const canvas = scannerCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
    });

    if (code) {
        stopScanner();
        showScanResult(code.data);
        return;
    }

    scannerAnimationId = requestAnimationFrame(scanFrame);
}

// Stop kamera
if (stopScanBtn) {
    stopScanBtn.addEventListener('click', stopScanner);
}

function stopScanner() {
    if (scannerAnimationId) {
        cancelAnimationFrame(scannerAnimationId);
        scannerAnimationId = null;
    }
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    scannerVideo.srcObject = null;
    scannerViewport.style.display = 'none';
    if (startScanBtn) startScanBtn.style.display = '';
}

// Upload billede til scanning
if (scanFileInput) {
    scanFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (typeof jsQR === 'undefined') {
            showToast(t('scanner.libMissing'), 'error');
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
            });

            if (code) {
                showScanResult(code.data);
            } else {
                showToast(t('scanner.noQR'), 'info');
            }

            // Reset file input
            scanFileInput.value = '';
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            showToast(t('scanner.imgError'), 'error');
            scanFileInput.value = '';
        };

        img.src = url;
    });
}

// Vis scanningsresultat
function showScanResult(data) {
    scanResult.style.display = 'block';
    scanResultText.textContent = data;

    // Vis "Åbn link" knap hvis resultatet er en URL
    try {
        const url = new URL(data);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            scanOpenLink.href = data;
            scanOpenLink.style.display = '';
        } else {
            scanOpenLink.style.display = 'none';
        }
    } catch {
        scanOpenLink.style.display = 'none';
    }

    // Scroll til resultatet
    scanResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Kopiér scanningsresultat
if (scanCopyBtn) {
    scanCopyBtn.addEventListener('click', async () => {
        const text = scanResultText.textContent;
        try {
            await navigator.clipboard.writeText(text);
            showToast(t('toast.textCopied'), 'success');
        } catch {
            // Fallback for ældre browsere
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(t('toast.textCopied'), 'success');
        }
    });
}

// ===========================================
// Onboarding Tooltip Tour
// ===========================================

(function initOnboarding() {
    if (localStorage.getItem('onboarding-done')) return;

    const steps = [
        {
            target: '.qr-type-tabs',
            text: t('onboard.step1')
        },
        {
            target: '.tab-content.active',
            text: t('onboard.step2')
        },
        {
            target: '.button-group',
            text: t('onboard.step3')
        }
    ];

    let current = 0;
    let overlay = null;
    let tooltip = null;
    let stepTimer = null;

    function handleKey(e) {
        if (e.key === 'Escape') dismiss();
    }

    function start() {
        overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', t('onboard.ariaLabel'));
        document.body.appendChild(overlay);

        tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(tooltip);

        document.addEventListener('keydown', handleKey);

        requestAnimationFrame(() => {
            overlay.classList.add('active');
            showStep(0);
        });

        overlay.addEventListener('click', dismiss);
    }

    function showStep(index) {
        current = index;
        const step = steps[index];
        const targetEl = document.querySelector(step.target);
        if (!targetEl) { dismiss(); return; }

        // Remove previous highlight
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));

        // Highlight current target
        targetEl.classList.add('onboarding-highlight');

        // Build tooltip content
        tooltip.innerHTML = `
            <div class="onboarding-step">${t('onboard.step', { n: index + 1, total: steps.length })}</div>
            <div class="onboarding-text">${step.text}</div>
            <div class="onboarding-actions">
                <div class="onboarding-dots">
                    ${steps.map((_, i) => `<div class="onboarding-dot${i === index ? ' active' : ''}"></div>`).join('')}
                </div>
                <div class="onboarding-btns">
                    <button class="onboarding-btn onboarding-btn-skip">${t('onboard.skip')}</button>
                    <button class="onboarding-btn onboarding-btn-next">${index === steps.length - 1 ? t('onboard.done') : t('onboard.next')}</button>
                </div>
            </div>
        `;

        // Position tooltip below target
        const rect = targetEl.getBoundingClientRect();
        const tooltipWidth = Math.min(320, window.innerWidth - 32);
        const margin = 16;
        const maxLeft = window.scrollX + window.innerWidth - tooltipWidth - margin;
        const tooltipTop = rect.bottom + window.scrollY + 12;
        const tooltipLeft = Math.max(margin + window.scrollX, Math.min(rect.left + window.scrollX, maxLeft));

        tooltip.style.top = tooltipTop + 'px';
        tooltip.style.left = tooltipLeft + 'px';

        tooltip.className = 'onboarding-tooltip';

        // Scroll target into view if needed
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        requestAnimationFrame(() => {
            tooltip.classList.add('active');
            // Move focus to next button for keyboard accessibility
            const nextBtn = tooltip.querySelector('.onboarding-btn-next');
            if (nextBtn) nextBtn.focus();
        });

        // Bind buttons
        tooltip.querySelector('.onboarding-btn-skip').addEventListener('click', dismiss);
        tooltip.querySelector('.onboarding-btn-next').addEventListener('click', next);
    }

    function next() {
        if (stepTimer) return;
        if (current < steps.length - 1) {
            tooltip.classList.remove('active');
            stepTimer = setTimeout(() => {
                stepTimer = null;
                showStep(current + 1);
            }, 200);
        } else {
            dismiss();
        }
    }

    function dismiss() {
        localStorage.setItem('onboarding-done', '1');
        document.removeEventListener('keydown', handleKey);
        if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; }
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
        if (overlay) { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); }
        if (tooltip) { tooltip.classList.remove('active'); setTimeout(() => tooltip.remove(), 300); }
    }

    // Start after a brief delay so the page is fully rendered
    setTimeout(start, 800);
})();

// ===========================================
// QR Lightbox
// ===========================================

(function initLightbox() {
    const lightbox = document.getElementById('qrLightbox');
    if (!lightbox) return;
    const content = lightbox.querySelector('.lightbox-content');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    function open() {
        if (!currentQRCanvas && !currentQRSVG) return;
        content.innerHTML = '';
        if (currentQRCanvas) {
            const clone = document.createElement('canvas');
            clone.width = currentQRCanvas.width;
            clone.height = currentQRCanvas.height;
            clone.getContext('2d').drawImage(currentQRCanvas, 0, 0);
            content.appendChild(clone);
        } else if (currentQRSVG) {
            content.innerHTML = currentQRSVG;
        }
        lightbox.classList.add('active');
        closeBtn.focus();
    }

    function close() {
        lightbox.classList.remove('active');
    }

    qrPreview.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) close();
    });
})();

// ===========================================
// Scroll to Top Button
// ===========================================

(function initScrollToTop() {
    const btn = document.getElementById('scrollToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ===========================================
// Lazy-load below-fold sections
// ===========================================

(() => {
    const lazySections = document.querySelectorAll('.lazy-section');
    if (!lazySections.length || !('IntersectionObserver' in window)) {
        lazySections.forEach(s => s.classList.add('visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });
    lazySections.forEach(s => observer.observe(s));
})();

// ===========================================
// Button Ripple Effect
// ===========================================

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

// ===========================================
// Mobile Navigation
// ===========================================

(() => {
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const menuClose = document.getElementById('menuClose');
    if (!menuToggle || !mobileNav) return;

    function openMenu() {
        mobileNav.classList.add('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (menuClose) menuClose.focus();
    }

    function closeMenu() {
        mobileNav.classList.remove('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuToggle.focus();
    }

    menuToggle.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMenu);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMenu();
        }
    });

    // Close when clicking a nav link
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const tab = link.dataset.navTab;
            if (tab) {
                e.preventDefault();
                switchToTab(tab);
                document.querySelector('.input-section')?.scrollIntoView({ behavior: 'smooth' });
            }
            closeMenu();
        });
    });
})();

// ===========================================
// Keyboard Shortcuts
// ===========================================

(() => {
    const overlay = document.getElementById('shortcutsOverlay');
    if (!overlay) return;
    const closeBtn = overlay.querySelector('.shortcuts-close');

    function toggleShortcuts() {
        overlay.classList.toggle('active');
    }

    function closeShortcuts() {
        overlay.classList.remove('active');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeShortcuts);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeShortcuts();
    });

    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in form fields
        const tag = e.target.tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;

        if (e.key === 'Escape') {
            closeShortcuts();
            return;
        }

        if (isInput) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        switch (e.key) {
            case '?':
                e.preventDefault();
                toggleShortcuts();
                break;
            case 'g':
                e.preventDefault();
                generateQRCode();
                break;
            case 'd':
                e.preventDefault();
                if (downloadBtn && !downloadBtn.disabled) downloadBtn.click();
                break;
            case 'c':
                e.preventDefault();
                if (copyBtn && !copyBtn.disabled) copyBtn.click();
                break;
            case 't':
                e.preventDefault();
                if (themeToggle) themeToggle.click();
                break;
            case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                e.preventDefault();
                switchToTab(tabOrder[parseInt(e.key) - 1]);
                break;
        }
    });
})();

// ===========================================
// Language Switcher
// ===========================================

(() => {
    const langBtn = document.getElementById('langSwitcher');
    if (!langBtn) return;

    const altLang = LANG === 'da' ? 'en' : 'da';
    const altLink = document.querySelector(`link[hreflang="${altLang}"]`);
    if (altLink) {
        langBtn.href = altLink.href;
    }
})();
