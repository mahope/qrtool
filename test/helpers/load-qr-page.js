'use strict';

const fs = require('fs');
const path = require('path');
const { createBrowserEnv } = require('./dom-stub');

const QR_PAGE_FILE = path.join(__dirname, '..', '..', 'lib', 'qr-page.js');
const QRCODE_LIB = path.join(__dirname, '..', '..', 'lib', 'qrcode.js');
const JSQR_LIB = path.join(__dirname, '..', '..', 'lib', 'jsQR.min.js');

const qrcode = require(QRCODE_LIB);
const jsQR = require(JSQR_LIB);

// lib/qr-page.js is a classic browser script: wrap the source in a function
// body and pass the stubbed browser globals as parameters. Inside the
// wrapper `typeof module` is undefined, so the script publishes window.QRPage.
function loadQRPage(options = {}) {
    const source = fs.readFileSync(QR_PAGE_FILE, 'utf8');
    const env = createBrowserEnv();

    const injected = Object.assign({}, env.globals, {
        qrcode,
        jsQR,
        URL: options.URL || URL,
        TextEncoder
    }, options.globals || {});
    if (options.withoutJsQR) delete injected.jsQR;

    const names = Object.keys(injected);

    const factory = new Function(...names, `${source}
;return window.QRPage;`);

    const api = factory(...names.map(name => injected[name]));

    return {
        api,
        env,
        field: id => env.getElementById(id),
        document: env.document,
        toastText: () => {
            const container = env.getElementById('toastContainer');
            const last = container.children.at(-1);
            return last ? last.children[1].textContent : '';
        }
    };
}

module.exports = { loadQRPage, QR_PAGE_FILE, qrcode, jsQR };
