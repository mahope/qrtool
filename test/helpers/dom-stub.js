'use strict';

// Minimal DOM/LocalStorage stubs so app.js can be evaluated in Node.
// Not a browser emulation: only the surface app.js touches at load time.

class ClassList {
    constructor(element) {
        this.element = element;
        this.set = new Set();
    }
    add(...names) { names.forEach(n => this.set.add(n)); }
    remove(...names) { names.forEach(n => this.set.delete(n)); }
    toggle(name, force) {
        const has = this.set.has(name);
        const next = force === undefined ? !has : Boolean(force);
        if (next) this.set.add(name); else this.set.delete(name);
        return next;
    }
    replace(oldName, newName) {
        this.remove(oldName);
        if (newName) this.add(newName);
    }
    contains(name) { return this.set.has(name); }
    get value() { return Array.from(this.set).join(' '); }
}

function createElement(id, tagName = 'DIV') {
    const element = {
        id: id || '',
        tagName: String(tagName).toUpperCase(),
        nodeType: 1,
        value: '',
        checked: false,
        textContent: '',
        innerHTML: '',
        disabled: false,
        hidden: false,
        dataset: {},
        files: [],
        options: [],
        style: {},
        listeners: {},
        children: [],
        parentElement: null,
        classList: null,
    };
    element.classList = new ClassList(element);

    element.addEventListener = (type, handler) => {
        (element.listeners[type] = element.listeners[type] || []).push(handler);
    };
    element.removeEventListener = (type, handler) => {
        const list = element.listeners[type] || [];
        const i = list.indexOf(handler);
        if (i !== -1) list.splice(i, 1);
    };
    element.dispatchEvent = (event) => {
        (element.listeners[event.type] || []).slice().forEach(h => h(event));
        return true;
    };
    element.setAttribute = (name, value) => { element.attributes[name] = String(value); };
    element.getAttribute = name => (name in element.attributes ? element.attributes[name] : null);
    element.removeAttribute = name => { delete element.attributes[name]; };
    element.hasAttribute = name => name in element.attributes;
    element.querySelector = selector => {
        if (!element.__children) element.__children = new Map();
        if (!element.__children.has(selector)) {
            const child = createElement('', 'SPAN');
            element.__children.set(selector, child);
        }
        return element.__children.get(selector);
    };
    element.querySelectorAll = selector => (element.__children && element.__children.has(selector)
        ? [element.__children.get(selector)]
        : []);
    element.closest = () => null;
    element.appendChild = child => { element.children.push(child); return child; };
    element.removeChild = child => element.children;
    element.remove = () => {};
    element.cloneNode = () => createElement(id, tagName);
    element.focus = () => {};
    element.blur = () => {};
    element.select = () => {};
    element.click = () => element.dispatchEvent({ type: 'click', target: element });
    element.scrollIntoView = () => {};
    element.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
    element.attributes = {};
    return element;
}

function createCanvasStub() {
    const canvas = createElement('', 'CANVAS');
    canvas.width = 300;
    canvas.height = 150;
    canvas.calls = [];
    const ctx = new Proxy({ canvas }, {
        get(target, prop) {
            if (prop === 'canvas') return canvas;
            if (prop in target) return target[prop];
            return (...args) => {
                canvas.calls.push({ method: String(prop), args });
            };
        },
        set(target, prop, value) {
            target[prop] = value;
            return true;
        }
    });
    canvas.getContext = () => ctx;
    canvas.toDataURL = () => 'data:image/png;base64,';
    canvas.toBlob = cb => cb(new Blob([], { type: 'image/png' }));
    return canvas;
}

function createDom() {
    const elements = new Map();
    const documentListeners = {};

    const documentElement = createElement('html', 'HTML');
    documentElement.lang = 'da';

    const body = createElement('body', 'BODY');

    const getElement = id => {
        if (!elements.has(id)) elements.set(id, createElement(id));
        return elements.get(id);
    };

    const document = {
        documentElement,
        body,
        head: createElement('head', 'HEAD'),
        cookie: '',
        hidden: false,
        listeners: documentListeners,
        getElementById: getElement,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: tagName => (String(tagName).toLowerCase() === 'canvas'
            ? createCanvasStub()
            : createElement('', tagName)),
        addEventListener: (type, handler) => {
            (documentListeners[type] = documentListeners[type] || []).push(handler);
        },
        removeEventListener: () => {},
        dispatchEvent: () => true,
        execCommand: () => true,
        elements,
    };
    return document;
}

function createStorage() {
    const map = new Map();
    return {
        map,
        getItem: key => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => { map.set(key, String(value)); },
        removeItem: key => { map.delete(key); },
        clear: () => map.clear(),
        key: i => Array.from(map.keys())[i] ?? null,
        get length() { return map.size; }
    };
}

/**
 * Builds the browser globals app.js needs, plus a reference to the fake DOM
 * so tests can read and write element values.
 */
function createBrowserEnv() {
    const document = createDom();
    const localStorage = createStorage();
    const window = {
        document,
        localStorage,
        innerWidth: 1280,
        innerHeight: 800,
        scrollX: 0,
        scrollY: 0,
        location: { href: 'https://qrtool.dk/', origin: 'https://qrtool.dk', pathname: '/' },
        print: () => {},
        scrollTo: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        matchMedia: () => ({ matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
        requestAnimationFrame: () => 0,
        cancelAnimationFrame: () => {},
        getComputedStyle: () => ({ getPropertyValue: () => '' }),
        URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
        customElements: { define: () => {}, get: () => undefined }
    };
    window.window = window;

    const navigator = {
        language: 'da-DK',
        languages: ['da-DK', 'da'],
        userAgent: 'node-test',
        platform: 'mac',
        clipboard: { writeText: () => Promise.resolve() },
        share: () => Promise.resolve(),
        serviceWorker: undefined,
        geolocation: { getCurrentPosition: () => {} },
        sendBeacon: () => false
    };

    class IntersectionObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    class FileReader {
        readAsDataURL() {}
        readAsText() {}
        readAsArrayBuffer() {}
    }

    const globals = {
        window,
        document,
        localStorage,
        navigator,
        location: window.location,
        IntersectionObserver,
        FileReader,
        requestAnimationFrame: window.requestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame,
        matchMedia: window.matchMedia,
        alert: () => {},
        confirm: () => false,
        print: () => {},
        fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
        console
    };

    return { globals, document, window, localStorage, getElementById: document.getElementById };
}

module.exports = { createBrowserEnv, createElement, createDom, createStorage, createCanvasStub };
