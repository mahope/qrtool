'use strict';

// Cache-busting for the built site.
//
// nginx serves .css/.js with a 7-day max-age and the site sits behind
// Cloudflare, which caches each full URL (including the query string) for the
// same period. A bare `app.js` therefore keeps serving an old file for up to a
// week after a deploy. Every HTML reference carries a `?v=` token, and this
// module derives that token from the actual asset contents, so a changed
// app.js/style.css/qrcode.js gets a new URL and a cache miss.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VERSIONED = ['app.js', 'style.css', 'lib/qrcode.js', 'lib/qr-page.js', 'lib/qr-scan.js'];

function computeVersion(distDir) {
    const hash = crypto.createHash('sha256');
    for (const rel of VERSIONED) {
        hash.update(rel);
        hash.update('\0');
        hash.update(fs.readFileSync(path.join(distDir, rel)));
        hash.update('\0');
    }
    return hash.digest('hex').slice(0, 10);
}

// Rewrites every `?v=` token on a versioned asset and adds one to assets that
// have none yet (lib/qrcode.js).
function applyVersion(content, version) {
    let out = content.replace(
        /(style\.css|app\.js|lib\/qrcode\.js|lib\/qr-page\.js|lib\/qr-scan\.js)\?v=[0-9a-f]+/g,
        `$1?v=${version}`
    );
    out = out.replace(/(lib\/qrcode\.js|lib\/qr-page\.js|lib\/qr-scan\.js)(?!\?v=)/g, `$1?v=${version}`);
    return out;
}

module.exports = { VERSIONED, computeVersion, applyVersion };
