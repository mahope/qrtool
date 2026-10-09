'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

function setup() {
    const api = loadApp();
    api.setTab('app');
    return {
        api,
        field: id => api.field(id),
        qrData: () => api.getQRData()
    };
}

test('App Store: builds a store link from a numeric app id', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'ios';
    field('appId').value = '123456789';
    assert.equal(qrData(), 'https://apps.apple.com/app/id123456789');
});

test('App Store: accepts an id already prefixed with "id"', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'ios';
    field('appId').value = 'id123456789';
    assert.equal(qrData(), 'https://apps.apple.com/app/id123456789');
});

test('App Store: keeps a pasted App Store URL unchanged', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'ios';
    field('appId').value = 'https://apps.apple.com/dk/app/mitprogram/id123456789';
    assert.equal(qrData(), 'https://apps.apple.com/dk/app/mitprogram/id123456789');
});

test('Google Play: builds a store link from a package name', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'android';
    field('appId').value = 'com.example.app';
    assert.equal(qrData(), 'https://play.google.com/store/apps/details?id=com.example.app');
});

test('Google Play: keeps a pasted Play Store URL unchanged', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'android';
    field('appId').value = 'https://play.google.com/store/apps/details?id=com.example.app';
    assert.equal(qrData(), 'https://play.google.com/store/apps/details?id=com.example.app');
});

test('App link: returns null without an id', () => {
    const { field, qrData } = setup();
    field('appPlatform').value = 'ios';
    field('appId').value = '';
    assert.equal(qrData(), null);
});

test('App link: validation rejects an ios id without digits', () => {
    const { api, field } = setup();
    field('appPlatform').value = 'ios';
    field('appId').value = 'mitprogram';
    assert.equal(api.validateForm(), false);
});

test('App link: validation accepts a pasted store URL', () => {
    const { api, field } = setup();
    field('appPlatform').value = 'android';
    field('appId').value = 'https://play.google.com/store/apps/details?id=com.example.app';
    assert.equal(api.validateForm(), true);
});
