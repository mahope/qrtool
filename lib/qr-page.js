/*
 * QRTool — delt logik for QR-type-undersiderne
 * (wifi, vcard, email, sms, kalender, tekst og deres en/-spejle).
 *
 * Siderne har hver deres lille inline-script med den type-specifikke
 * data (WiFi-streng, vCard, mailto …), men tegning, printstørrelse,
 * PDF-eksport, scan-kontrol og download er ens. Det bor her, så alle
 * undersider får det samme som forsiden: hvid quiet zone, fejlkorrektion
 * H, download i 300 dpi ved en printstørrelse i mm, PDF i præcis størrelse
 * og en kontrol af om den færdige kode kan scannes.
 *
 * Forsiden (app.js) har sine egne rigere funktioner (logo, CTA, faner,
 * batch) og bruger ikke denne fil.
 */
(function () {
    'use strict';

    // QR-koder med æøå skal være UTF-8 og ikke Latin-1: ellers viser telefonens
    // kameraapp "Gæster" som "GÃ¦ster". qrcode-biblioteket har konverteren.
    if (typeof qrcode !== 'undefined' && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    }

    // QR-standarden kræver mindst fire modulers lys kant om koden. Uden den
    // kant rammer koden kanten af billedet, og det er der, scannerapps fejler.
    var QUIET_ZONE_MODULES = 4;

    // Højeste fejlkorrektion (~30 %): den tåler mere slid og printfejl end M.
    var EC_LEVEL = 'H';

    var PRINT_DPI = 300;

    var MESSAGES = {
        da: {
            'generateFirst': 'Generer først en QR-kode.',
            'downloaded': 'QR-kode downloadet!',
            'printDownloaded': 'QR-kode downloadet i {mm} mm (300 dpi)!',
            'webpUnsupported': 'Denne browser understøtter ikke WebP.',
            'sizeHint': 'Valgfri. Udfyldes den, downloades PNG/JPG/WebP i 300 dpi og PDF i præcis den størrelse.',
            'scan.checking': 'Kontrollerer om koden kan scannes …',
            'scan.ok': 'Kontrol: QR-koden kan scannes, og indholdet stemmer.',
            'scan.fail': 'Kontrollen kunne ikke læse koden. Prøv en større størrelse.',
            'scan.mismatch': 'Kontrollen læser noget andet end det indtastede.',
            'downloadError': 'Download mislykkedes: {message}'
        },
        en: {
            'generateFirst': 'Generate a QR code first.',
            'downloaded': 'QR code downloaded!',
            'printDownloaded': 'QR code downloaded at {mm} mm (300 dpi)!',
            'webpUnsupported': 'This browser does not support WebP.',
            'sizeHint': 'Optional. When set, PNG/JPG/WebP download at 300 dpi and the PDF at exactly that size.',
            'scan.checking': 'Checking whether the code scans …',
            'scan.ok': 'Check: the QR code scans, and the content matches.',
            'scan.fail': 'The check could not read the code. Try a larger size.',
            'scan.mismatch': 'The check read something other than what you entered.',
            'downloadError': 'Download failed: {message}'
        }
    };

    function language() {
        var el = typeof document !== 'undefined' && document.documentElement;
        var lang = (el && el.lang ? el.lang : '').toLowerCase();
        return lang.indexOf('en') === 0 ? 'en' : 'da';
    }

    function t(key, vars) {
        var dict = MESSAGES[language()] || MESSAGES.da;
        var message = dict[key] || MESSAGES.da[key] || key;
        if (vars) {
            Object.keys(vars).forEach(function (name) {
                message = message.split('{' + name + '}').join(String(vars[name]));
            });
        }
        return message;
    }

    // Millimeter til pixels ved et givet dpi
    function mmToPixels(mm, dpi) {
        return Math.round((mm / 25.4) * (dpi || PRINT_DPI));
    }

    // Læs printstørrelsen i mm; null hvis tom eller ugyldig. Værdien klampes
    // til 5–300 mm, så et tastet 5000 ikke laver en flere gigabyte stor canvas.
    function parsePrintSizeMm() {
        var input = typeof document !== 'undefined' && document.getElementById('printSizeMm');
        if (!input) return null;
        var mm = parseFloat(input.value);
        if (!isFinite(mm) || mm <= 0) return null;
        return Math.min(300, Math.max(5, mm));
    }

    // Vis mm og den tilhørende pixelstørrelse ved 300 dpi under feltet
    function updatePrintSizeHint() {
        var hint = typeof document !== 'undefined' && document.getElementById('printSizeHint');
        if (!hint) return;
        var mm = parsePrintSizeMm();
        if (!mm) {
            hint.textContent = t('sizeHint');
            return;
        }
        var px = mmToPixels(mm);
        hint.textContent = mm + ' mm = ' + px + '×' + px + ' px ved 300 dpi';
    }

    // Tegn QR-koden på en canvas med hvid kant (quiet zone) omkring
    function drawCanvas(qr, pixelSize, canvas, color) {
        if (!color) {
            var colorInput = typeof document !== 'undefined' && document.getElementById('qrColor');
            color = (colorInput && colorInput.value) || '#000000';
        }

        var cells = qr.getModuleCount();
        var scale = pixelSize / (cells + QUIET_ZONE_MODULES * 2);

        canvas.width = pixelSize;
        canvas.height = pixelSize;

        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pixelSize, pixelSize);
        ctx.fillStyle = color;

        for (var y = 0; y < cells; y++) {
            for (var x = 0; x < cells; x++) {
                if (qr.isDark(y, x)) {
                    var px = (x + QUIET_ZONE_MODULES) * scale;
                    var py = (y + QUIET_ZONE_MODULES) * scale;
                    ctx.fillRect(px, py, scale, scale);
                }
            }
        }
        return canvas;
    }

    // SVG-streng med quiet zone omkring koden
    function toSvgString(qr, border, color) {
        if (!color) {
            var colorInput = typeof document !== 'undefined' && document.getElementById('qrColor');
            color = (colorInput && colorInput.value) || '#000000';
        }
        if (typeof border !== 'number') border = QUIET_ZONE_MODULES;

        var cells = qr.getModuleCount();
        var size = cells + border * 2;

        var parts = [];
        parts.push('<?xml version="1.0" encoding="UTF-8"?>');
        parts.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/TR/SVG11/DTD/svg11.dtd">');
        parts.push('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' + size + ' ' + size + '" stroke="none">');
        parts.push('<rect width="100%" height="100%" fill="#ffffff"/>');
        parts.push('<path d="');
        for (var y = 0; y < cells; y++) {
            for (var x = 0; x < cells; x++) {
                if (qr.isDark(y, x)) {
                    var px = x + border;
                    var py = y + border;
                    parts.push('M' + px + ',' + py + 'h1v1h-1z');
                }
            }
        }
        parts.push('" fill="' + color + '"/>');
        parts.push('</svg>');
        return parts.join('\n');
    }

    // Ny canvas med koden i en given pixelstørrelse (bruges til print og PDF)
    function renderCanvas(qr, pixelSize, color) {
        var canvas = document.createElement('canvas');
        return drawCanvas(qr, pixelSize, canvas, color);
    }

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Minimal PDF med ét JPEG-billede placeret på en side
    function buildPDFDocument(jpegBytes, imgW, imgH, pageW, pageH, place) {
        var w = Math.round(place.w);
        var h = Math.round(place.h);
        var x = Math.round(place.x);
        var y = Math.round(place.y);

        var objs = [];
        var offsets = [];
        var pos = 0;

        function add(s) {
            var b = new TextEncoder().encode(s);
            objs.push(b);
            pos += b.length;
            return b;
        }

        function addObj(n, s) {
            offsets[n] = pos;
            return add(n + ' 0 obj\n' + s + '\nendobj\n');
        }

        add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
        addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
        addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
        addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>');

        var stream = 'q ' + w + ' 0 0 ' + h + ' ' + x + ' ' + y + ' cm /Im0 Do Q';
        addObj(4, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');

        var imgHead = '5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n';
        var imgTail = '\nendstream\nendobj\n';
        offsets[5] = pos;
        objs.push(new TextEncoder().encode(imgHead));
        pos += imgHead.length;
        objs.push(jpegBytes);
        pos += jpegBytes.length;
        objs.push(new TextEncoder().encode(imgTail));
        pos += imgTail.length;

        var xrefPos = pos;
        add('xref\n0 6\n0000000000 65535 f \n');
        for (var i = 1; i <= 5; i++) {
            add(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
        }
        add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n');

        return new Blob(objs, { type: 'application/pdf' });
    }

    // PDF med koden centreret på A4
    function buildPDF(jpegBytes, imgW, imgH) {
        var pageW = 595.28, pageH = 841.89;
        var maxDim = 400;
        var scale = Math.min(maxDim / imgW, maxDim / imgH);
        var w = imgW * scale;
        var h = imgH * scale;
        return buildPDFDocument(jpegBytes, imgW, imgH, pageW, pageH, {
            w: w, h: h, x: (pageW - w) / 2, y: (pageH - h) / 2
        });
    }

    // Print-PDF: side i præcis den fysiske størrelse (mm), koden fylder siden
    function buildPrintPDF(jpegBytes, imgW, imgH, mm) {
        var pt = Math.round(((mm * 72) / 25.4) * 100) / 100;
        return buildPDFDocument(jpegBytes, imgW, imgH, pt, pt, { w: pt, h: pt, x: 0, y: 0 });
    }

    function showToast(message, type) {
        var icons = { success: '\u2705', error: '\u274C', info: '\u2139\uFE0F' };
        var container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + (type || 'success');
        var icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = icons[type] || icons.info;
        var text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(icon);
        toast.appendChild(text);
        container.appendChild(toast);
        requestAnimationFrame(function () { toast.classList.add('show'); });
        setTimeout(function () {
            toast.classList.replace('show', 'hide');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    // Download i det valgte format. Printstørrelsen i mm (valgfri) giver
    // 300 dpi i PNG/JPG/WebP og en PDF-side i præcis den fysiske størrelse.
    function download(options) {
        var format = options.format;
        var mm = options.mm || null;
        var stamp = Date.now();
        var prefix = options.prefix || 'qr-code';
        var canvas = options.canvas || null;
        var svg = options.svg || null;

        function fail() {
            showToast(t('generateFirst'), 'info');
        }

        function finish(message) {
            if (typeof options.onDone === 'function') options.onDone();
            if (message) showToast(message, 'success');
        }

        try {
            if (format === 'svg') {
                if (!svg && typeof options.svgFrom === 'function') svg = options.svgFrom();
                if (!svg) { fail(); return; }
                downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), prefix + '-' + stamp + '.svg');
                finish(t('downloaded'));
                return;
            }

            if (format === 'pdf') {
                var pdfCanvas = (mm && typeof options.renderAt === 'function')
                    ? options.renderAt(mmToPixels(mm))
                    : canvas;
                if (!pdfCanvas) { fail(); return; }
                pdfCanvas.toBlob(function (blob) {
                    if (!blob) return;
                    blob.arrayBuffer().then(function (buffer) {
                        var jpeg = new Uint8Array(buffer);
                        var pdf = mm
                            ? buildPrintPDF(jpeg, pdfCanvas.width, pdfCanvas.height, mm)
                            : buildPDF(jpeg, pdfCanvas.width, pdfCanvas.height);
                        downloadBlob(pdf, prefix + '-' + stamp + '.pdf');
                        finish(mm ? t('printDownloaded', { mm: mm }) : t('downloaded'));
                    });
                }, 'image/jpeg', 0.95);
                return;
            }

            // PNG / JPG / WebP
            var rasterCanvas = (mm && typeof options.renderAt === 'function')
                ? options.renderAt(mmToPixels(mm))
                : canvas;
            if (!rasterCanvas) { fail(); return; }

            var mime = format === 'jpg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
            var filename = prefix + '-' + stamp + '.' + (format === 'jpg' ? 'jpg' : (format === 'webp' ? 'webp' : 'png'));

            // JPG har ingen gennemsigtighed, så læg koden på hvid først
            function save(target) {
                target.toBlob(function (blob) {
                    if (!blob) { showToast(t('webpUnsupported'), 'error'); return; }
                    downloadBlob(blob, filename);
                    finish(mm ? t('printDownloaded', { mm: mm }) : t('downloaded'));
                }, mime, 0.95);
            }

            if (format === 'jpg') {
                var flat = document.createElement('canvas');
                flat.width = rasterCanvas.width;
                flat.height = rasterCanvas.height;
                var flatCtx = flat.getContext('2d');
                flatCtx.fillStyle = '#ffffff';
                flatCtx.fillRect(0, 0, flat.width, flat.height);
                flatCtx.drawImage(rasterCanvas, 0, 0);
                save(flat);
            } else {
                save(rasterCanvas);
            }
        } catch (error) {
            console.error('Fejl ved download:', error);
            showToast(t('downloadError', { message: error.message }), 'error');
        }
    }

    // ---- Scan-kontrol: læs den færdige kode igen med den dekoder en
    // telefon bruger (jsQR), så brugeren opdager en ulæselig kode før
    // den trykkes ud. jsQR er valgfrit — uden det sker der ingen kontrol.

    var scanStatusEl = null;
    var scanCheckTimer = null;

    function getScanStatusElement() {
        if (scanStatusEl && scanStatusEl.parentElement) return scanStatusEl;
        scanStatusEl = document.getElementById('scanStatus');
        if (!scanStatusEl) {
            scanStatusEl = document.createElement('p');
            scanStatusEl.id = 'scanStatus';
            scanStatusEl.className = 'scan-status';
            scanStatusEl.setAttribute('role', 'status');
            var preview = document.getElementById('qrPreview');
            if (preview && preview.parentElement) {
                preview.parentElement.insertBefore(scanStatusEl, preview.nextElementSibling);
            }
        }
        scanStatusEl.hidden = true;
        return scanStatusEl;
    }

    function setScanStatus(message, state) {
        var el = getScanStatusElement();
        el.textContent = message;
        el.dataset.state = state;
        el.hidden = !message;
    }

    function decodeQRCanvas(canvas) {
        if (!canvas || typeof jsQR === 'undefined') return null;
        // QR-koden er kvadratisk
        var side = Math.min(canvas.width, canvas.height);
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, side, side);
        var code = jsQR(imageData.data, side, side, { inversionAttempts: 'attemptBoth' });
        return code ? code.data : null;
    }

    function updateScanStatus(expected) {
        if (typeof jsQR === 'undefined') {
            setScanStatus('', 'ok');
            return;
        }

        var decoded = null;
        try {
            decoded = decodeQRCanvas(typeof currentScanCanvas !== 'undefined' ? currentScanCanvas : null);
        } catch (error) {
            console.error('Scan-kontrol fejlede:', error);
        }

        if (decoded === null) {
            setScanStatus(t('scan.fail'), 'warn');
        } else if (decoded !== expected) {
            setScanStatus(t('scan.mismatch'), 'warn');
        } else {
            setScanStatus(t('scan.ok'), 'ok');
        }
    }

    var currentScanCanvas = null;

    // Dekodning koster op mod 100 ms på store koder, så den må ikke stå i
    // vejen for selve genereringen
    function scheduleScanCheck(canvas, expected) {
        currentScanCanvas = canvas || null;
        if (!currentScanCanvas || typeof jsQR === 'undefined') return;
        setScanStatus(t('scan.checking'), 'checking');
        if (scanCheckTimer) clearTimeout(scanCheckTimer);
        scanCheckTimer = setTimeout(function () { updateScanStatus(expected); }, 250);
    }

    // Printstørrelse: forudfyldte knapper og hint under feltet
    function initPrintSize() {
        updatePrintSizeHint();
        var presets = document.querySelectorAll('.print-preset');
        for (var i = 0; i < presets.length; i++) {
            presets[i].addEventListener('click', function (event) {
                var mm = event.currentTarget.getAttribute('data-mm');
                var input = document.getElementById('printSizeMm');
                if (input && mm) input.value = mm;
                updatePrintSizeHint();
            });
        }
    }

    var api = {
        QUIET_ZONE_MODULES: QUIET_ZONE_MODULES,
        EC_LEVEL: EC_LEVEL,
        PRINT_DPI: PRINT_DPI,
        t: t,
        mmToPixels: mmToPixels,
        parsePrintSizeMm: parsePrintSizeMm,
        updatePrintSizeHint: updatePrintSizeHint,
        drawCanvas: drawCanvas,
        toSvgString: toSvgString,
        renderCanvas: renderCanvas,
        buildPDF: buildPDF,
        buildPrintPDF: buildPrintPDF,
        download: download,
        scheduleScanCheck: scheduleScanCheck,
        updateScanStatus: updateScanStatus,
        decodeQRCanvas: decodeQRCanvas,
        initPrintSize: initPrintSize
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        window.QRPage = api;
    }

    // I browseren kobles forudfyldningsknapperne med det samme (scriptet
    // står sidst i body, så felterne findes). I Node (test) springes det over.
    if (typeof document !== 'undefined' && typeof window !== 'undefined' && window.document === document) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPrintSize);
        } else {
            initPrintSize();
        }
    }
})();
