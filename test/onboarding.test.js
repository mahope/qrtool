'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app');
const { createBrowserEnv, createElement } = require('./helpers/dom-stub');

function setup(lang = 'da') {
    const env = createBrowserEnv();
    env.document.documentElement.lang = lang;
    const timers = [];
    let button;
    let focused;
    env.getElementById('generateBtn').after = el => {
        button = el;
        el.focus = () => { focused = el; };
    };
    const api = loadApp({ globals: {
        ...env.globals,
        setTimeout: fn => { timers.push(fn); return timers.length; },
        clearTimeout: () => {},
        requestAnimationFrame: fn => { fn(); return 0; }
    } });
    return { env, api, timers, button: () => button, focused: () => focused,
        flush: () => { while (timers.length) timers.shift()(); },
        overlay: () => env.document.body.children.find(el => el.className === 'onboarding-overlay') };
}

test('first visit never starts the tour and keeps QR input usable', () => {
    const ctx = setup();
    ctx.flush();
    assert.equal(ctx.overlay(), undefined);
    assert.equal(ctx.env.localStorage.getItem('onboarding-done'), null);
    ctx.env.getElementById('qrText').value = 'https://example.com';
    assert.equal(ctx.api.getQRData(), 'https://example.com');
});

for (const [lang, label] of [['da', 'Sådan virker det'], ['en', 'How it works']]) {
    test(`${lang}: explicit start skips missing and hidden targets; Escape restores focus`, () => {
        const ctx = setup(lang);
        assert.ok(ctx.button(), 'help button is inserted after Generate');
        assert.equal(ctx.button().tagName, 'BUTTON');
        assert.equal(ctx.button().textContent, label);
        const hidden = createElement('hidden');
        hidden.getClientRects = () => [];
        const visible = createElement('visible');
        visible.getClientRects = () => [{ width: 100, height: 50 }];
        ctx.env.document.querySelector = selector => ({ '.tab-content.active': hidden, '.button-group': visible }[selector] || null);
        assert.doesNotThrow(() => ctx.button().click());
        assert.ok(ctx.overlay());
        assert.ok(visible.classList.contains('onboarding-highlight'));
        const handler = ctx.env.document.listeners.keydown.at(-1);
        handler({ key: 'Escape' });
        assert.equal(ctx.focused(), ctx.button());
        assert.equal(ctx.env.localStorage.getItem('onboarding-done'), '1');
        ctx.flush();
        ctx.env.document.querySelector = () => null;
        assert.doesNotThrow(() => ctx.button().click());
        ctx.flush();
        assert.equal(ctx.focused(), ctx.button());
    });
}
