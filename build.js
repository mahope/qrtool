#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Clean dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Files/dirs to copy to dist
const copyItems = [
    'index.html', 'wifi-qr-kode.html', 'om-qr-tool.html', 'privatlivspolitik.html',
    'cookiepolitik.html', '404.html', 'vcard-qr-kode.html', 'email-qr-kode.html',
    'sms-qr-kode.html', 'kalender-qr-kode.html', 'tekst-qr-kode.html',
    'style.css', 'app.js', 'sw.js',
    'sitemap.xml', 'robots.txt', 'manifest.json', 'icon.svg', 'ads.txt',
    '.htaccess',
    'lib', 'guides'
];

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy all items
for (const item of copyItems) {
    const src = path.join(ROOT, item);
    if (fs.existsSync(src)) {
        copyRecursive(src, path.join(DIST, item));
    }
}

// Minify CSS
console.log('Minifying style.css...');
execSync(`npx esbuild "${path.join(DIST, 'style.css')}" --minify --outfile="${path.join(DIST, 'style.css')}" --allow-overwrite`, { stdio: 'inherit' });

// Minify app.js
console.log('Minifying app.js...');
execSync(`npx esbuild "${path.join(DIST, 'app.js')}" --minify --outfile="${path.join(DIST, 'app.js')}" --allow-overwrite`, { stdio: 'inherit' });

// Minify sw.js
console.log('Minifying sw.js...');
execSync(`npx esbuild "${path.join(DIST, 'sw.js')}" --minify --outfile="${path.join(DIST, 'sw.js')}" --allow-overwrite`, { stdio: 'inherit' });

// Minify lib/qrcode.js (jszip and jsQR are already minified)
console.log('Minifying lib/qrcode.js...');
execSync(`npx esbuild "${path.join(DIST, 'lib', 'qrcode.js')}" --minify --outfile="${path.join(DIST, 'lib', 'qrcode.js')}" --allow-overwrite`, { stdio: 'inherit' });

console.log('Build complete! Output in dist/');
