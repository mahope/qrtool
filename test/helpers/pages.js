'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', 'dist', 'docs', '.git', 'test']);

function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (entry.name.endsWith('.html')) out.push(path.relative(ROOT, full).split(path.sep).join('/'));
    }
    return out;
}

// Every shipped HTML page (Danish, en/, guides/, 404), as repo-relative POSIX paths.
const pages = walk(ROOT, []).sort();

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

module.exports = { ROOT, pages, read };
