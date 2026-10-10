/*
 * QRTool — QR-læser (scanning) for /scan-qr-kode og /en/scan-qr-code.
 *
 * Alt foregår i browseren: kameraet læses lokalt, og uploadede billeder
 * dekodes med jsQR uden at blive sendt nogen steder hen. Det er hele
 * sitets løfte til brugerne, så der må ikke føjes netværkskald til her.
 *
 * Dekodningen (decodeImageData/decodeCanvas) er ren og kan testes i Node
 * uden en browser; DOM-wiringen kører kun når der findes et document.
 */
(function () {
    'use strict';

    var MESSAGES = {
        da: {
            'libMissing': 'QR-læseren kunne ikke indlæses. Genindlæs siden og prøv igen.',
            'camDenied': 'Kameraadgang blev afvist. Tillad kameraadgang i din browser og prøv igen.',
            'camError': 'Kunne ikke starte kameraet. Har din enhed et kamera?',
            'scanning': 'Leder efter en QR-kode …',
            'noQR': 'Ingen QR-kode fundet i billedet. Prøv et andet billede, eller kom tættere på.',
            'imgError': 'Kunne ikke læse billedet. Prøv et andet billede.',
            'copied': 'Kopieret!',
            'copyFail': 'Kunne ikke kopiere automatisk. Markér teksten og kopiér manuelt.'
        },
        en: {
            'libMissing': 'The QR reader could not load. Reload the page and try again.',
            'camDenied': 'Camera access was denied. Allow camera access in your browser and try again.',
            'camError': 'Could not start the camera. Does your device have a camera?',
            'scanning': 'Looking for a QR code …',
            'noQR': 'No QR code found in the image. Try another image, or move closer.',
            'imgError': 'Could not read the image. Try another image.',
            'copied': 'Copied!',
            'copyFail': 'Could not copy automatically. Select the text and copy it manually.'
        }
    };

    function language() {
        var el = typeof document !== 'undefined' && document.documentElement;
        var lang = (el && el.lang ? el.lang : '').toLowerCase();
        return lang.indexOf('en') === 0 ? 'en' : 'da';
    }

    function t(key) {
        var dict = MESSAGES[language()] || MESSAGES.da;
        return dict[key] || MESSAGES.da[key] || key;
    }

    // ---- ren dekodning (testes i Node) --------------------------------

    // RGBA-pixels → tekst. jsQR er valgfrit: uden det sker der ingen dekodning.
    function decodeImageData(data, width, height) {
        if (typeof jsQR === 'undefined' || !data || !width || !height) return null;
        var code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
        return code ? code.data : null;
    }

    function decodeCanvas(canvas) {
        if (!canvas || typeof canvas.getContext !== 'function') return null;
        var ctx = canvas.getContext('2d');
        if (!ctx) return null;
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return decodeImageData(imageData.data, canvas.width, canvas.height);
    }

    // Kun rigtige links bliver klikbare; en WiFi- eller vCard-streng er ikke et link.
    function isUrl(text) {
        return typeof text === 'string' && /^https?:\/\/\S+$/i.test(text.trim());
    }

    // ---- browser-wiring ----------------------------------------------

    var stream = null;
    var rafId = null;
    var dom = {};

    function byId(id) {
        return typeof document !== 'undefined' ? document.getElementById(id) : null;
    }

    function status(message) {
        if (!dom.status) return;
        dom.status.textContent = message || '';
        dom.status.hidden = !message;
    }

    function showResult(text) {
        if (!dom.result || !dom.resultText) return;
        dom.resultText.textContent = text;
        dom.result.style.display = 'block';
        if (dom.openLink) {
            if (isUrl(text)) {
                dom.openLink.href = text;
                dom.openLink.style.display = '';
            } else {
                dom.openLink.removeAttribute('href');
                dom.openLink.style.display = 'none';
            }
        }
    }

    function stopCamera() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
        }
        if (dom.video) dom.video.srcObject = null;
        if (dom.viewport) dom.viewport.style.display = 'none';
        if (dom.startBtn) dom.startBtn.style.display = '';
    }

    function scanFrame() {
        var video = dom.video;
        var canvas = dom.canvas;
        if (!video || !canvas || !stream) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
            var w = video.videoWidth;
            var h = video.videoHeight;
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, w, h);
            var decoded = decodeCanvas(canvas);
            if (decoded) {
                stopCamera();
                status('');
                showResult(decoded);
                return;
            }
        }
        rafId = requestAnimationFrame(scanFrame);
    }

    function startCamera() {
        if (typeof jsQR === 'undefined') { status(t('libMissing')); return; }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            status(t('camError'));
            return;
        }
        status(t('scanning'));
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        }).then(function (s) {
            stream = s;
            if (dom.startBtn) dom.startBtn.style.display = 'none';
            if (dom.viewport) dom.viewport.style.display = '';
            if (dom.video) {
                dom.video.srcObject = s;
                dom.video.setAttribute('playsinline', 'true');
                return dom.video.play();
            }
        }).then(function () {
            rafId = requestAnimationFrame(scanFrame);
        }).catch(function (error) {
            stopCamera();
            if (error && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
                status(t('camDenied'));
            } else {
                status(t('camError'));
            }
        });
    }

    function loadImage(file) {
        if (!file) return;
        if (typeof jsQR === 'undefined') { status(t('libMissing')); return; }
        status(t('scanning'));
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
            // Store telefonbilleder skaleres ned, så dekodningen ikke hakker.
            var maxSide = 1600;
            var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            var w = Math.max(1, Math.round(img.width * scale));
            var h = Math.max(1, Math.round(img.height * scale));
            var canvas = dom.canvas || document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            var decoded = decodeCanvas(canvas);
            if (decoded) {
                status('');
                showResult(decoded);
            } else {
                status(t('noQR'));
            }
        };
        img.onerror = function () {
            URL.revokeObjectURL(url);
            status(t('imgError'));
        };
        img.src = url;
    }

    function copyResult() {
        var text = dom.resultText ? dom.resultText.textContent : '';
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                status(t('copied'));
            }).catch(function () {
                status(t('copyFail'));
            });
        } else {
            status(t('copyFail'));
        }
    }

    function init() {
        dom = {
            startBtn: byId('startScanBtn'),
            stopBtn: byId('stopScanBtn'),
            fileInput: byId('scanFileInput'),
            viewport: byId('scannerViewport'),
            video: byId('scannerVideo'),
            canvas: byId('scannerCanvas'),
            status: byId('scanStatus'),
            result: byId('scanResult'),
            resultText: byId('scanResultText'),
            copyBtn: byId('scanCopyBtn'),
            openLink: byId('scanOpenLink')
        };
        if (!dom.startBtn && !dom.fileInput) return;

        if (dom.startBtn) dom.startBtn.addEventListener('click', startCamera);
        if (dom.stopBtn) dom.stopBtn.addEventListener('click', function () { stopCamera(); status(''); });
        if (dom.fileInput) dom.fileInput.addEventListener('change', function (event) {
            loadImage(event.target.files && event.target.files[0]);
            event.target.value = '';
        });
        if (dom.copyBtn) dom.copyBtn.addEventListener('click', copyResult);
        if (typeof window !== 'undefined') window.addEventListener('pagehide', stopCamera);
    }

    var api = {
        decodeImageData: decodeImageData,
        decodeCanvas: decodeCanvas,
        isUrl: isUrl,
        t: t,
        init: init
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        window.QRScan = api;
    }

    if (typeof document !== 'undefined' && typeof window !== 'undefined' && window.document === document) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
})();
