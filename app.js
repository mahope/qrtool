// Theme management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'dark'
const currentTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', currentTheme);

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const theme = html.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

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

// Generer logo QR-kode ved load
function generateLogoQR() {
    // Vent til qrcode er loaded
    if (typeof qrcode === 'undefined') {
        setTimeout(generateLogoQR, 100);
        return;
    }

    const logoSvg = document.getElementById('logoQR');

    // Brug qrcode generator biblioteket
    const qr = qrcode(0, 'M');
    qr.addData('https://mahope.dk');
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

// Generer QR-kode
generateBtn.addEventListener('click', generateQRCode);

function generateQRCode() {
    const text = getQRData();

    if (!text) {
        alert('Indtast venligst den påkrævede information!');
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

        // Aktiver download knap
        downloadBtn.disabled = false;

        // Save to history
        saveToHistory(text, currentTab);

        // Vis success feedback
        generateBtn.textContent = '✓ Genereret!';
        generateBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

        setTimeout(() => {
            generateBtn.textContent = 'Generer QR-kode';
            generateBtn.style.background = '';
        }, 2000);

    } catch (error) {
        console.error('Fejl ved generering af QR-kode:', error);
        alert('Der opstod en fejl ved generering af QR-koden: ' + error.message);
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

// Download QR-kode
downloadBtn.addEventListener('click', downloadQRCode);

function downloadQRCode() {
    const format = fileFormat.value;
    const filename = `qr-code-${Date.now()}.${format}`;

    try {
        if (format === 'svg') {
            // Download SVG
            if (!currentQRSVG) {
                alert('Generer venligst en QR-kode først!');
                return;
            }

            const blob = new Blob([currentQRSVG], { type: 'image/svg+xml;charset=utf-8' });
            downloadBlob(blob, filename);

        } else if (format === 'png') {
            // Download PNG
            if (!currentQRCanvas) {
                alert('Generer venligst en QR-kode først!');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                downloadBlob(blob, filename);
            }, 'image/png');

        } else if (format === 'jpg') {
            // Download JPG
            if (!currentQRCanvas) {
                alert('Generer venligst en QR-kode først!');
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
                alert('Generer venligst en QR-kode først!');
                return;
            }

            currentQRCanvas.toBlob((blob) => {
                if (!blob) {
                    alert('Din browser understøtter ikke WebP format. Vælg venligst et andet format.');
                    return;
                }
                downloadBlob(blob, filename);
            }, 'image/webp', 0.95);
        }

        // Vis download feedback
        downloadBtn.textContent = '✓ Downloaded!';
        downloadBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        downloadBtn.style.color = 'white';

        setTimeout(() => {
            downloadBtn.textContent = 'Download';
            downloadBtn.style.background = '';
            downloadBtn.style.color = '';
        }, 2000);

    } catch (error) {
        console.error('Fejl ved download:', error);
        alert('Der opstod en fejl ved download: ' + error.message);
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

// Batch generation with JSZip
batchGenerateBtn.addEventListener('click', async () => {
    const lines = batchInput.value.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        alert('Indtast venligst mindst én URL/tekst!');
        return;
    }

    if (lines.length > 100) {
        alert('Maksimalt 100 QR-koder ad gangen!');
        return;
    }

    // Check if JSZip is available (we'll need to add this library)
    if (typeof JSZip === 'undefined') {
        alert('Batch generering kræver JSZip biblioteket. Genindlæs venligst siden.');
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

        batchGenerateBtn.textContent = '✓ Færdig!';
        setTimeout(() => {
            batchGenerateBtn.textContent = originalText;
            batchGenerateBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Fejl ved batch generering:', error);
        alert('Der opstod en fejl: ' + error.message);
        batchGenerateBtn.textContent = originalText;
        batchGenerateBtn.disabled = false;
    }
});

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

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p class="history-empty">Ingen tidligere QR-koder</p>';
        clearHistory.style.display = 'none';
        return;
    }

    clearHistory.style.display = 'block';

    historyList.innerHTML = history.map((entry, index) => {
        const date = new Date(entry.timestamp);
        const typeIcon = {
            'text': '📝',
            'wifi': '📶',
            'vcard': '👤',
            'email': '✉️',
            'sms': '💬',
            'calendar': '📅'
        }[entry.type] || '📝';

        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-text">${typeIcon} ${entry.text}</div>
                    <div class="history-item-date">${date.toLocaleString('da-DK')}</div>
                </div>
                <div class="history-item-actions">
                    <button class="btn-history-action" onclick="loadFromHistory(${index})" title="Genindlæs">🔄</button>
                    <button class="btn-history-action" onclick="deleteFromHistory(${index})" title="Slet">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

window.loadFromHistory = function(index) {
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
    if (targetTab === 'text') {
        qrText.value = entry.text;
    }

    // Generate QR code
    setTimeout(() => generateQRCode(), 100);
};

window.deleteFromHistory = function(index) {
    const history = getHistory();
    history.splice(index, 1);
    localStorage.setItem('qr-history', JSON.stringify(history));
    renderHistory();
};

clearHistory.addEventListener('click', () => {
    if (confirm('Er du sikker på at du vil slette hele historikken?')) {
        localStorage.removeItem('qr-history');
        renderHistory();
    }
});

// Load history on page load
renderHistory();

// Generer automatisk når der indtastes (med debounce)
let debounceTimer;
qrText.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    if (qrText.value.trim()) {
        debounceTimer = setTimeout(() => {
            generateQRCode();
        }, 1000);
    }
});

// Generer automatisk ved ændring af indstillinger
[qrColor, bgColor, qrSize, errorCorrection, fileFormat, qrStyle].forEach(element => {
    element.addEventListener('change', () => {
        if (currentQRCanvas || currentQRSVG) {
            generateQRCode();
        }
    });
});

transparentBg.addEventListener('change', () => {
    if (currentQRCanvas || currentQRSVG) {
        generateQRCode();
    }
});

// Keyboard shortcut: Enter til at generere
qrText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateQRCode();
    }
});
