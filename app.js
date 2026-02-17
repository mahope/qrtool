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
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Tab management
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
let currentTab = 'text';

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.querySelector(`[data-content="${tabName}"]`).classList.add('active');

        currentTab = tabName;
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
const qrPreview = document.getElementById('qrPreview');

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

// Opdater farveværdi display
qrColor.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = e.target.value;
});

bgColor.addEventListener('input', (e) => {
    e.target.nextElementSibling.textContent = e.target.value;
});

// Håndter transparent baggrund checkbox
transparentBg.addEventListener('change', (e) => {
    if (e.target.checked) {
        bgColor.disabled = true;
        bgColor.parentElement.style.opacity = '0.5';
        // Hvis JPG er valgt, skift til PNG
        if (fileFormat.value === 'jpg') {
            fileFormat.value = 'png';
        }
    } else {
        bgColor.disabled = false;
        bgColor.parentElement.style.opacity = '1';
    }
});

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

            // WiFi QR format: WIFI:T:WPA;S:mynetwork;P:mypassword;H:false;;
            return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;

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

        default:
            return null;
    }
}

// Generer QR-kode (with null check for button)
if (generateBtn) {
    generateBtn.addEventListener('click', generateQRCode);
}

function generateQRCode() {
    const text = getQRData();

    if (!text) {
        showToast('Indtast venligst den påkrævede information!', 'error');
        return;
    }

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

        if (format === 'svg') {
            // Generer SVG
            currentQRSVG = toSvgString(qr, 2, style);
            qrPreview.innerHTML = currentQRSVG;
            currentQRCanvas = null;
        } else {
            // Generer Canvas
            const canvas = document.createElement('canvas');
            drawCanvas(qr, size, canvas, style);
            qrPreview.appendChild(canvas);
            currentQRCanvas = canvas;
            currentQRSVG = null;
        }

        // Aktiver download og kopiér knapper
        downloadBtn.disabled = false;
        if (copyBtn) copyBtn.disabled = false;

        // Save to history
        saveToHistory(text, currentTab);

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

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    // Fyld baggrund
    if (!transparentBg.checked) {
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, size, size);
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
                    ctx.roundRect(px, py, scale, scale, radius);
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

// Batch generation with JSZip (with null check)
if (batchGenerateBtn && batchInput) {
    batchGenerateBtn.addEventListener('click', async () => {
        const lines = batchInput.value.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        showToast('Indtast venligst mindst én URL/tekst!', 'error');
        return;
    }

    if (lines.length > 100) {
        showToast('Maksimalt 100 QR-koder ad gangen!', 'error');
        return;
    }

    // Check if JSZip is available (we'll need to add this library)
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

            batchGenerateBtn.textContent = `Genererer ${i + 1}/${lines.length}...`;
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `qr-codes-${Date.now()}.zip`);

        showToast(`${lines.length} QR-koder downloadet som ZIP!`, 'success');
        batchGenerateBtn.textContent = originalText;
        batchGenerateBtn.disabled = false;

    } catch (error) {
        console.error('Fejl ved batch generering:', error);
        showToast('Fejl ved batch generering: ' + error.message, 'error');
        batchGenerateBtn.textContent = originalText;
        batchGenerateBtn.disabled = false;
    }
    });
}

// History management
function saveToHistory(text, type) {
    const history = getHistory();
    const entry = {
        text: text.substring(0, 100), // Limit text length
        type: type,
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
    const stored = localStorage.getItem('qr-history');
    return stored ? JSON.parse(stored) : [];
}

// Sanitize text for safe HTML display (XSS prevention)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">Ingen tidligere QR-koder</p>';
        clearHistory.style.display = 'none';
        return;
    }

    clearHistory.style.display = 'block';

    // Clear existing content
    historyList.innerHTML = '';

    history.forEach((entry, index) => {
        const date = new Date(entry.timestamp);
        const typeIcon = {
            'text': '📝',
            'wifi': '📶',
            'vcard': '👤',
            'email': '✉️',
            'sms': '💬',
            'calendar': '📅'
        }[entry.type] || '📝';

        // Create elements safely (XSS prevention)
        const item = document.createElement('div');
        item.className = 'history-item';

        const info = document.createElement('div');
        info.className = 'history-item-info';

        const textDiv = document.createElement('div');
        textDiv.className = 'history-item-text';
        textDiv.textContent = `${typeIcon} ${entry.text}`;

        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-item-date';
        dateDiv.textContent = date.toLocaleString('da-DK');

        info.appendChild(textDiv);
        info.appendChild(dateDiv);

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn-history-action';
        loadBtn.title = 'Genindlæs';
        loadBtn.textContent = '🔄';
        loadBtn.setAttribute('aria-label', 'Genindlæs denne QR-kode');
        loadBtn.addEventListener('click', () => loadFromHistory(index));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-history-action';
        deleteBtn.title = 'Slet';
        deleteBtn.textContent = '🗑️';
        deleteBtn.setAttribute('aria-label', 'Slet denne QR-kode fra historik');
        deleteBtn.addEventListener('click', () => deleteFromHistory(index));

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

    // For text tab, just load the text
    if (targetTab === 'text' && qrText) {
        qrText.value = entry.text;
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

// Expose functions globally for backward compatibility
window.loadFromHistory = loadFromHistory;
window.deleteFromHistory = deleteFromHistory;

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
[qrColor, bgColor, qrSize, errorCorrection, fileFormat, qrStyle].forEach(element => {
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
