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
const tabOrder = ['text', 'wifi', 'vcard', 'email', 'sms', 'calendar', 'geo'];
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
        fields: { qrText: 'https://dinrestaurant.dk/menu' },
        cta: 'Se vores menu'
    },
    'wifi-guest': {
        tab: 'wifi',
        fields: { wifiSSID: 'GuestWiFi', wifiPassword: '', wifiEncryption: 'WPA' },
        cta: 'Forbind til WiFi'
    },
    'business-card': {
        tab: 'vcard',
        fields: { vcardName: '', vcardOrg: '', vcardTitle: '', vcardPhone: '', vcardEmail: '' },
        cta: 'Scan for kontaktinfo'
    },
    'event-invite': {
        tab: 'calendar',
        fields: { calTitle: '', calLocation: '' },
        cta: 'Tilføj til kalender'
    },
    'social-link': {
        tab: 'text',
        fields: { qrText: 'https://instagram.com/ditbrugernavn' },
        cta: 'Følg os'
    },
    'feedback': {
        tab: 'text',
        fields: { qrText: 'https://forms.gle/dit-formular-link' },
        cta: 'Giv os feedback'
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

        showToast(`Skabelon "${card.querySelector('.template-name').textContent}" indlæst.`, 'info');
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
    L: 'Lav (~7%) — Til rene overflader og digitale skærme',
    M: 'Medium (~15%) — Anbefalet til de fleste formål',
    Q: 'Høj (~25%) — Til print og overflader med lidt slid',
    H: 'Meget høj (~30%) — Til print med logo eller udendørs brug'
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
            showToast('Fejlkorrektion sat til Meget høj for bedre logo-kompatibilitet.', 'info');
        }

        if (currentQRCanvas || currentQRSVG) generateQRCode();
    };
    img.onerror = () => {
        URL.revokeObjectURL(url);
        currentLogoObjectUrl = null;
        showToast('Kunne ikke indlæse billedet.', 'error');
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
                setFieldError('qrText', 'Indtast tekst eller en URL.');
                valid = false;
            }
            break;
        }
        case 'wifi': {
            const ssid = document.getElementById('wifiSSID').value.trim();
            if (!ssid) {
                setFieldError('wifiSSID', 'Netværksnavn er påkrævet.');
                valid = false;
            }
            break;
        }
        case 'vcard': {
            const name = document.getElementById('vcardName').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            const website = document.getElementById('vcardWebsite').value.trim();
            if (!name) {
                setFieldError('vcardName', 'Navn er påkrævet.');
                valid = false;
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setFieldError('vcardEmail', 'Ugyldig e-mail-adresse.');
                valid = false;
            }
            if (website && !/^https?:\/\/.+/.test(website)) {
                setFieldError('vcardWebsite', 'URL skal starte med https://');
                valid = false;
            }
            break;
        }
        case 'email': {
            const to = document.getElementById('emailTo').value.trim();
            if (!to) {
                setFieldError('emailTo', 'E-mail-adresse er påkrævet.');
                valid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                setFieldError('emailTo', 'Ugyldig e-mail-adresse.');
                valid = false;
            }
            break;
        }
        case 'sms': {
            const phone = document.getElementById('smsPhone').value.trim();
            if (!phone) {
                setFieldError('smsPhone', 'Telefonnummer er påkrævet.');
                valid = false;
            }
            break;
        }
        case 'calendar': {
            const title = document.getElementById('calTitle').value.trim();
            const start = document.getElementById('calStart').value;
            if (!title) {
                setFieldError('calTitle', 'Begivenhedsnavn er påkrævet.');
                valid = false;
            }
            if (!start) {
                setFieldError('calStart', 'Startdato er påkrævet.');
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
                setFieldError('geoLat', 'Breddegrad er påkrævet.');
                valid = false;
            } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
                setFieldError('geoLat', 'Breddegrad skal være mellem -90 og 90.');
                valid = false;
            }
            if (!lngStr) {
                setFieldError('geoLng', 'Længdegrad er påkrævet.');
                valid = false;
            } else if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
                setFieldError('geoLng', 'Længdegrad skal være mellem -180 og 180.');
                valid = false;
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

        // Save to history
        saveToHistory(text, currentTab);

        // Focus preview for keyboard users
        qrPreview.setAttribute('tabindex', '-1');
        qrPreview.focus({ preventScroll: true });

        // Announce to screen readers
        if (qrAnnouncement) {
            const typeLabels = { text: 'URL/tekst', wifi: 'WiFi', vcard: 'visitkort', email: 'e-mail', sms: 'SMS', calendar: 'kalender', geo: 'lokation' };
            const label = typeLabels[currentTab] || currentTab;
            const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
            qrAnnouncement.textContent = 'QR-kode genereret for ' + label + ': ' + preview;
        }

        showToast('QR-kode genereret!', 'success');

    } catch (error) {
        console.error('Fejl ved generering af QR-kode:', error);
        showToast('Fejl ved generering: ' + error.message, 'error');
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
                showToast('Generer venligst en QR-kode først!', 'info');
                return;
            }

            const blob = new Blob([currentQRSVG], { type: 'image/svg+xml;charset=utf-8' });
            downloadBlob(blob, filename);

        } else if (format === 'png') {
            // Download PNG
            if (!currentQRCanvas) {
                showToast('Generer venligst en QR-kode først!', 'info');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                downloadBlob(blob, filename);
            }, 'image/png');

        } else if (format === 'jpg') {
            // Download JPG
            if (!currentQRCanvas) {
                showToast('Generer venligst en QR-kode først!', 'info');
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
                showToast('Generer venligst en QR-kode først!', 'info');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                if (!blob) {
                    showToast('Din browser understøtter ikke WebP. Vælg et andet format.', 'error');
                    return;
                }
                downloadBlob(blob, filename);
            }, 'image/webp', 0.95);
        }

        showToast('QR-kode downloadet!', 'success');

    } catch (error) {
        console.error('Fejl ved download:', error);
        showToast('Fejl ved download: ' + error.message, 'error');
    }
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
        showToast('Din browser understøtter ikke kopiering af billeder. Prøv Chrome eller Edge.', 'error');
        return;
    }

    try {
        let canvas = currentQRCanvas;

        // Hvis SVG: render til et midlertidigt canvas
        if (!canvas && currentQRSVG) {
            canvas = await svgToCanvas(currentQRSVG);
        }

        if (!canvas) {
            showToast('Generer venligst en QR-kode først!', 'info');
            return;
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            showToast('Kunne ikke oprette billede. Prøv en mindre størrelse.', 'error');
            return;
        }

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);

        showToast('Kopieret til udklipsholder!', 'success');

    } catch (error) {
        console.error('Fejl ved kopiering:', error);
        showToast('Kunne ikke kopiere. Sørg for at siden kører over HTTPS.', 'error');
    }
}

// Print QR-kode
if (printBtn) {
    printBtn.addEventListener('click', () => {
        if (!currentQRCanvas && !currentQRSVG) {
            showToast('Generer venligst en QR-kode først!', 'info');
            return;
        }
        window.print();
    });
}

// Del QR-kode via Web Share API
if (shareBtn) {
    shareBtn.addEventListener('click', shareQRCode);
}

async function shareQRCode() {
    if (!navigator.share) {
        showToast('Deling er ikke understøttet i din browser. Prøv at kopiere i stedet.', 'info');
        return;
    }

    try {
        let canvas = currentQRCanvas;
        if (!canvas && currentQRSVG) {
            canvas = await svgToCanvas(currentQRSVG);
        }
        if (!canvas) {
            showToast('Generer venligst en QR-kode først!', 'info');
            return;
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
            showToast('Kunne ikke oprette billede til deling.', 'error');
            return;
        }

        const file = new File([blob], 'qr-kode.png', { type: 'image/png' });

        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            showToast('Din browser understøtter ikke deling af billeder.', 'info');
            return;
        }

        await navigator.share({
            title: 'QR-kode fra QRTool.dk',
            files: [file]
        });

        showToast('QR-kode delt!', 'success');
    } catch (error) {
        // User cancelled the share dialog — not an error
        if (error.name !== 'AbortError') {
            console.error('Fejl ved deling:', error);
            showToast('Kunne ikke dele QR-koden.', 'error');
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
            showToast('Indtast venligst mindst én URL/tekst!', 'error');
            return;
        }
        if (lines.length > 100) {
            showToast('Maksimalt 100 QR-koder ad gangen!', 'error');
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

        showToast(`${lines.length} QR-koder vist i forhåndsvisning`, 'success');
    });
}

// Generate batch with progress bar
if (batchGenerateBtn && batchInput) {
    batchGenerateBtn.addEventListener('click', async () => {
        const lines = getBatchLines();

        if (lines.length === 0) {
            showToast('Indtast venligst mindst én URL/tekst!', 'error');
            return;
        }

        if (lines.length > 100) {
            showToast('Maksimalt 100 QR-koder ad gangen!', 'error');
            return;
        }

        if (typeof JSZip === 'undefined') {
            showToast('JSZip biblioteket mangler. Genindlæs siden.', 'error');
            return;
        }

        const originalText = batchGenerateBtn.textContent;
        batchGenerateBtn.textContent = 'Genererer...';
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

            showToast(`${lines.length} QR-koder downloadet som ZIP!`, 'success');
            batchGenerateBtn.textContent = originalText;
            batchGenerateBtn.disabled = false;
            hideBatchProgress();

        } catch (error) {
            console.error('Fejl ved batch generering:', error);
            showToast('Fejl ved batch generering: ' + error.message, 'error');
            batchGenerateBtn.textContent = originalText;
            batchGenerateBtn.disabled = false;
            hideBatchProgress();
        }
    });
}

// History management
const historyControls = document.getElementById('historyControls');
const historySearch = document.getElementById('historySearch');
const historyFilter = document.getElementById('historyFilter');

const typeLabels = {
    'text': 'Tekst/URL',
    'wifi': 'WiFi',
    'vcard': 'vCard',
    'email': 'Email',
    'sms': 'SMS',
    'calendar': 'Kalender',
    'geo': 'Lokation'
};

function saveToHistory(text, type) {
    const history = getHistory();
    const entry = {
        text: text.substring(0, 200),
        type: type,
        label: '',
        timestamp: Date.now()
    };

    // Add to beginning, keep max 20 entries
    history.unshift(entry);
    if (history.length > 20) {
        history.splice(20);
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
        historyList.innerHTML = '<p class="history-empty">Ingen tidligere QR-koder</p>';
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
            if (filter !== 'all' && entry.type !== filter) return false;
            if (search) {
                const haystack = ((entry.label || '') + ' ' + entry.text + ' ' + (typeLabels[entry.type] || '')).toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        });

    historyList.innerHTML = '';

    if (filtered.length === 0) {
        historyList.innerHTML = '<p class="history-empty">Ingen resultater</p>';
        return;
    }

    filtered.forEach((entry) => {
        const date = new Date(entry.timestamp);

        const item = document.createElement('div');
        item.className = 'history-item';

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
        dateDiv.textContent = date.toLocaleString('da-DK');
        info.appendChild(dateDiv);

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn-history-action';
        renameBtn.title = 'Omdøb';
        renameBtn.textContent = '✏️';
        renameBtn.setAttribute('aria-label', 'Giv denne QR-kode et navn');
        renameBtn.addEventListener('click', () => renameHistoryEntry(entry.originalIndex));

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn-history-action';
        loadBtn.title = 'Genindlæs';
        loadBtn.textContent = '🔄';
        loadBtn.setAttribute('aria-label', 'Genindlæs denne QR-kode');
        loadBtn.addEventListener('click', () => loadFromHistory(entry.originalIndex));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-history-action';
        deleteBtn.title = 'Slet';
        deleteBtn.textContent = '🗑️';
        deleteBtn.setAttribute('aria-label', 'Slet denne QR-kode fra historik');
        deleteBtn.addEventListener('click', () => deleteFromHistory(entry.originalIndex));

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
    const name = prompt('Giv QR-koden et navn:', entry.label || '');
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
        if (confirm('Er du sikker på at du vil slette hele historikken?')) {
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
            showToast('Geolokation understøttes ikke i denne browser.', 'error');
            return;
        }
        geoLocateBtn.disabled = true;
        geoLocateBtn.textContent = '📍 Henter placering...';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('geoLat').value = pos.coords.latitude.toFixed(6);
                document.getElementById('geoLng').value = pos.coords.longitude.toFixed(6);
                geoLocateBtn.disabled = false;
                geoLocateBtn.textContent = '📍 Brug min placering';
                showToast('Placering hentet!', 'success');
            },
            (err) => {
                geoLocateBtn.disabled = false;
                geoLocateBtn.textContent = '📍 Brug min placering';
                const msgs = { 1: 'Adgang til placering blev nægtet.', 2: 'Placering ikke tilgængelig.', 3: 'Anmodning udløb.' };
                showToast(msgs[err.code] || 'Kunne ikke hente placering.', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
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
        showToast('QR-scanner biblioteket mangler. Genindlæs siden.', 'error');
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
            showToast('Kameraadgang blev afvist. Tillad kameraadgang i din browser.', 'error');
        } else {
            showToast('Kunne ikke starte kameraet. Har din enhed et kamera?', 'error');
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
            showToast('QR-scanner biblioteket mangler. Genindlæs siden.', 'error');
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
                showToast('Ingen QR-kode fundet i billedet. Prøv et andet billede.', 'info');
            }

            // Reset file input
            scanFileInput.value = '';
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            showToast('Kunne ikke indlæse billedet.', 'error');
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
            showToast('Tekst kopieret til udklipsholder!', 'success');
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
            showToast('Tekst kopieret til udklipsholder!', 'success');
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
            text: 'Vælg hvilken type QR-kode du vil lave — tekst, WiFi, visitkort og mere.'
        },
        {
            target: '.tab-content.active',
            text: 'Udfyld oplysningerne for din QR-kode her. Felterne ændrer sig med den valgte type.'
        },
        {
            target: '.button-group',
            text: 'Tryk Generer for at se din QR-kode, og Download eller Kopiér den bagefter.'
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
        overlay.setAttribute('aria-label', 'Introduktionsrundvisning');
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
            <div class="onboarding-step">Trin ${index + 1} af ${steps.length}</div>
            <div class="onboarding-text">${step.text}</div>
            <div class="onboarding-actions">
                <div class="onboarding-dots">
                    ${steps.map((_, i) => `<div class="onboarding-dot${i === index ? ' active' : ''}"></div>`).join('')}
                </div>
                <div class="onboarding-btns">
                    <button class="onboarding-btn onboarding-btn-skip">Spring over</button>
                    <button class="onboarding-btn onboarding-btn-next">${index === steps.length - 1 ? 'Forstået' : 'Næste'}</button>
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
            case '1': case '2': case '3': case '4': case '5': case '6': case '7':
                e.preventDefault();
                switchToTab(tabOrder[parseInt(e.key) - 1]);
                break;
        }
    });
})();
