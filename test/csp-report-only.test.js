'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const conf = fs.readFileSync(path.join(__dirname, '..', 'nginx.conf'), 'utf8');
const header = name => (conf.match(new RegExp(`add_header\\s+${name}\\s+(["'])([^]*?)\\1`)) || [])[2] || '';
const reportOnly = header('Content-Security-Policy-Report-Only');
const directive = name => (reportOnly.split(';').map(d => d.trim()).find(d => d.startsWith(name + ' ')) || '').split(/\s+/).slice(1);

test('report-only CSP is set next to the enforced policy and the other headers', () => {
    assert.ok(reportOnly, 'Content-Security-Policy-Report-Only is missing');
    assert.match(header('Content-Security-Policy'), /default-src 'self'/, 'the enforced policy must stay');
    assert.match(header('Permissions-Policy'), /geolocation=\(self\)/);
    assert.match(header('Strict-Transport-Security'), /max-age=/);
    assert.equal(header('Reporting-Endpoints'), 'csp="/csp-report"');
});

test('report-only CSP is strict: nothing by default, no eval, no plugins, no foreign frames', () => {
    assert.deepEqual(directive('default-src'), ["'none'"]);
    assert.ok(!/unsafe-eval|wasm-unsafe-eval/.test(reportOnly));
    assert.deepEqual(directive('object-src'), ["'none'"]);
    assert.deepEqual(directive('frame-src'), ["'none'"]);
    assert.deepEqual(directive('base-uri'), ["'self'"]);
    assert.deepEqual(directive('form-action'), ["'self'"]);
    assert.deepEqual(directive('frame-ancestors'), ["'self'"]);
    for (const d of ['script-src', 'connect-src', 'img-src', 'style-src', 'font-src']) {
        const hosts = directive(d).filter(s => /^https?:/.test(s));
        for (const host of hosts) assert.match(host, /^https:\/\/(analytics\.holstjensen\.eu|stats\.mahoje\.dk)$/, `${d} allows ${host}`);
    }
    assert.ok(directive('report-uri').includes('/csp-report'));
    assert.ok(directive('report-to').includes('csp'));
});

test('/csp-report logs the POST body to its own log and answers 204 without a third party', () => {
    const block = (conf.match(/location = \/csp-report \{[^]*?proxy_pass[^;]*;/) || [])[0] || '';
    assert.match(block, /limit_except POST/);
    assert.match(block, /access_log \/var\/log\/nginx\/csp-report\.log csp_report if=\$csp_report_post/);
    assert.match(block, /client_max_body_size 4k/);
    assert.match(block, /limit_req zone=csp_report/);
    assert.match(conf, /limit_req_zone [^;]*zone=csp_report:/);
    assert.match(conf, /log_format csp_report .*\$request_body/);
    assert.match(conf, /listen 127\.0\.0\.1:8081;[^]*return 204;/);
});

// The real check: drive the whole site in Chromium under the report-only policy.
// Skipped without a browser locally; under CI a missing browser fails the build.
let audit;
test('no CSP violations in report-only mode across all pages and features', { timeout: 280000 }, async (t) => {
    const { runAudit } = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'csp-audit.mjs')));
    try {
        audit = await runAudit();
    } catch (err) {
        if (process.env.CI) throw err;
        return t.skip(`no usable browser: ${err.message.split('\n')[0]}`);
    }
    assert.deepEqual(audit.violations, [], 'CSP violations:\n' + JSON.stringify(audit.violations, null, 2));
    assert.deepEqual(audit.posted, [], 'the browser reported violations to /csp-report');
    const allowed = new Set(["'self'", 'https://analytics.holstjensen.eu', 'https://stats.mahoje.dk']);
    for (const [type, origins] of Object.entries(audit.resources)) {
        for (const o of origins) assert.ok(allowed.has(o), `${type} loaded from unexpected origin ${o}`);
    }
});

test('the audit would notice a violation (negative control)', { timeout: 280000 }, async (t) => {
    if (!audit) return t.skip('browser audit did not run');
    const { runAudit } = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'csp-audit.mjs')));
    const strict = await runAudit({ policyOverride: "default-src 'none'; report-uri /csp-report" });
    assert.ok(strict.violations.length > 0, 'a policy of default-src none must produce violations');
    assert.ok(strict.posted.length > 0, 'and the browser must POST them to /csp-report');
});
