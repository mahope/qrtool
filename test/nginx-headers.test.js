'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const conf = fs.readFileSync(path.join(__dirname, '..', 'nginx.conf'), 'utf8');
const policy = (conf.match(/add_header\s+Permissions-Policy\s+"([^"]*)"/) || [])[1] || '';

test('Permissions-Policy lets the page itself use geolocation (the location tab needs it)', () => {
  assert.match(policy, /(^|,\s*)geolocation=\(self\)(,|$)/);
});

test('Permissions-Policy keeps the camera for the page and the microphone off', () => {
  assert.match(policy, /(^|,\s*)camera=\(self\)(,|$)/);
  assert.match(policy, /(^|,\s*)microphone=\(\)(,|$)/);
});
