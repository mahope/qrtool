'use strict';

const fs = require('fs');
const path = require('path');
const { createBrowserEnv } = require('./dom-stub');

const APP_FILE = path.join(__dirname, '..', '..', 'app.js');
const QRCODE_LIB = path.join(__dirname, '..', '..', 'lib', 'qrcode.js');
const JSQR_LIB = path.join(__dirname, '..', '..', 'lib', 'jsQR.min.js');

const qrcode = require(QRCODE_LIB);
const jsQR = require(JSQR_LIB);

// app.js is a classic browser script: every declaration lives at the top level.
// Wrapping the source in a function body gives us a scope where those `const`
// and `let` declarations can be reached through closures, without touching a
// single line of the shipped file.
function loadApp(options = {}) {
    const source = fs.readFileSync(APP_FILE, 'utf8');
    const env = createBrowserEnv();

    const injected = Object.assign({}, env.globals, { qrcode, jsQR }, options.globals || {});
    injected.__testApi = {};

    const names = Object.keys(injected);

    const factory = new Function(...names, `${source}
;__testApi.bind = {
    getQRData: () => getQRData(),
    getTab: () => currentTab,
    setTab: tab => { currentTab = tab; },
    saveToHistory: (...args) => saveToHistory(...args),
    getHistory: () => getHistory(),
    setHistorySavingEnabled: value => { historySavingEnabled = value; },
    isHistorySavingEnabled: () => historySavingEnabled,
    validateForm: () => validateForm(),
    translate: (key, vars) => t(key, vars),
    language: () => LANG,
    generateQRCode: () => generateQRCode(),
    updateScanStatus: text => updateScanStatus(text),
    decodeQRCanvas: canvas => decodeQRCanvas(canvas),
    scanStatus: () => scanStatusEl,
    setScanCanvas: canvas => { qrScanCanvas = canvas; },
    drawCanvas: (qr, size, canvas, style) => drawCanvas(qr, size, canvas, style),
    toSvgString: (qr, border, style) => toSvgString(qr, border, style),
    qrSvg: () => currentQRSVG,
    qrCanvas: () => currentQRCanvas,
    mmToPixels: (mm, dpi) => mmToPixels(mm, dpi),
    parsePrintSizeMm: () => parsePrintSizeMm(),
    buildPDF: (jpegBytes, imgW, imgH) => buildPDF(jpegBytes, imgW, imgH),
    buildPrintPDF: (jpegBytes, imgW, imgH, mm) => buildPrintPDF(jpegBytes, imgW, imgH, mm),
    renderPrintCanvas: mm => renderPrintCanvas(mm),
    downloadQRCode: () => downloadQRCode(),
    lastQR: () => lastQR
};`);

    factory(...names.map(name => injected[name]));

    const bind = injected.__testApi.bind;

    const api = {
        env,
        field: id => env.getElementById(id),
        storage: env.localStorage,
        getQRData: () => bind.getQRData(),
        tab: () => bind.getTab(),
        setTab: tab => bind.setTab(tab),
        saveToHistory: (...args) => bind.saveToHistory(...args),
        getHistory: () => bind.getHistory(),
        setHistorySavingEnabled: value => bind.setHistorySavingEnabled(value),
        isHistorySavingEnabled: () => bind.isHistorySavingEnabled(),
        validateForm: () => bind.validateForm(),
        translate: (key, vars) => bind.translate(key, vars),
        language: () => bind.language(),
        generateQRCode: () => bind.generateQRCode(),
        updateScanStatus: text => bind.updateScanStatus(text),
        decodeQRCanvas: canvas => bind.decodeQRCanvas(canvas),
        scanStatus: () => bind.scanStatus(),
        setScanCanvas: canvas => bind.setScanCanvas(canvas),
        drawCanvas: (qr, size, canvas, style) => bind.drawCanvas(qr, size, canvas, style),
        toSvgString: (qr, border, style) => bind.toSvgString(qr, border, style),
        qrSvg: () => bind.qrSvg(),
        qrCanvas: () => bind.qrCanvas(),
        mmToPixels: (mm, dpi) => bind.mmToPixels(mm, dpi),
        parsePrintSizeMm: () => bind.parsePrintSizeMm(),
        buildPDF: (jpegBytes, imgW, imgH) => bind.buildPDF(jpegBytes, imgW, imgH),
        buildPrintPDF: (jpegBytes, imgW, imgH, mm) => bind.buildPrintPDF(jpegBytes, imgW, imgH, mm),
        renderPrintCanvas: mm => bind.renderPrintCanvas(mm),
        downloadQRCode: () => bind.downloadQRCode(),
        lastQR: () => bind.lastQR()
    };

    return api;
}

module.exports = { loadApp, APP_FILE, qrcode, jsQR };
