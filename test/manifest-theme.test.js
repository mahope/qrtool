const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function htmlFiles(dir = '') {
    const out = [];
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        if (['node_modules', 'dist', '.git', 'docs'].includes(e.name)) continue;
        const rel = path.posix.join(dir, e.name);
        if (e.isDirectory()) out.push(...htmlFiles(rel));
        else if (rel.endsWith('.html')) out.push(rel);
    }
    return out;
}

test('manifest: colours follow the design tokens, not the old indigo/navy', () => {
    const raw = JSON.stringify(manifest).toLowerCase();
    assert.ok(!raw.includes('#6366f1') && !raw.includes('#0f172a'));
    assert.equal(manifest.theme_color, '#eef0f2');
    assert.equal(manifest.background_color, '#eef0f2');
});

test('manifest: any and maskable icons are separate entries that exist', () => {
    const purposes = manifest.icons.map((i) => i.purpose);
    assert.deepEqual(purposes.sort(), ['any', 'maskable']);
    for (const icon of manifest.icons) {
        assert.ok(fs.existsSync(path.join(root, icon.src)), `${icon.src} is missing`);
    }
});

test('manifest: shortcuts point at existing pages', () => {
    const urls = manifest.shortcuts.map((s) => s.url);
    assert.deepEqual(urls, ['/wifi-qr-kode', '/vcard-qr-kode', '/scan-qr-kode']);
    for (const u of urls) assert.ok(fs.existsSync(path.join(root, u.slice(1) + '.html')), u);
});

test('theme-color: every page has a light and a dark tag with token colours', () => {
    const bad = [];
    for (const rel of htmlFiles()) {
        const tags = fs.readFileSync(path.join(root, rel), 'utf8').match(/<meta name="theme-color"[^>]*>/g) || [];
        const ok = tags.length === 2
            && tags.some((t) => t.includes('#eef0f2') && t.includes('(prefers-color-scheme: light)'))
            && tags.some((t) => t.includes('#0e1013') && t.includes('(prefers-color-scheme: dark)'));
        if (!ok) bad.push(rel);
    }
    assert.deepEqual(bad, []);
});
