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
    language: () => LANG
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
        language: () => bind.language()
    };

    return api;
}

module.exports = { loadApp, APP_FILE, qrcode, jsQR };
