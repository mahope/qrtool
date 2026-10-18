#!/usr/bin/env node
'use strict';

// Sets <lastmod> in sitemap.xml to the date of the last commit that changed
// each page, so Google is told the truth about what has changed.
//
//   node scripts/update-sitemap-lastmod.js          rewrite sitemap.xml
//   node scripts/update-sitemap-lastmod.js --check  exit 1 if sitemap.xml is out of date
//
// Run it after the last content commit and commit sitemap.xml on its own.
// It is not part of build.js: the Docker build has no git history.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

// https://qrtool.dk/             -> index.html
// https://qrtool.dk/en/          -> en/index.html
// https://qrtool.dk/wifi-qr-kode -> wifi-qr-kode.html
function fileOf(loc) {
    const pathname = new URL(loc).pathname;
    return pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : `${pathname.slice(1)}.html`;
}

// One entry per <url>. A page without commit history keeps the date it has:
// the script never invents a date.
function planLastmods(xml, lastCommitDate) {
    const plan = [];
    for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
        const loc = /<loc>([^<]+)<\/loc>/.exec(match[1])[1].trim();
        const from = (/<lastmod>([^<]+)<\/lastmod>/.exec(match[1]) || [])[1];
        const file = fileOf(loc);
        plan.push({ loc, file, from, to: lastCommitDate(file) || from });
    }
    return plan;
}

function applyLastmods(xml, plan) {
    return xml.replace(/<url>[\s\S]*?<\/url>/g, block => {
        const loc = /<loc>([^<]+)<\/loc>/.exec(block)[1].trim();
        const entry = plan.find(p => p.loc === loc);
        if (!entry || !entry.to) return block;
        return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${entry.to}</lastmod>`);
    });
}

function git(...args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function main() {
    const check = process.argv.includes('--check');
    if (git('rev-parse', '--is-shallow-repository') === 'true') {
        console.error('This clone is shallow, so the commit dates are not real. Fetch the full history first.');
        process.exit(2);
    }

    const before = fs.readFileSync(SITEMAP, 'utf8');
    const plan = planLastmods(before, file => git('log', '-1', '--format=%cs', '--', file));

    const uncommitted = plan.map(p => p.file).filter(file => git('status', '--porcelain', '--', file) !== '');
    if (uncommitted.length) {
        console.warn(`Uncommitted changes, so lastmod will lag until they are committed:\n  ${uncommitted.join('\n  ')}`);
    }

    const after = applyLastmods(before, plan);
    const changes = plan.filter(p => p.to !== p.from);
    for (const { loc, from, to } of changes) console.log(`${loc}  ${from || '(none)'} -> ${to}`);

    if (after === before) {
        console.log('sitemap.xml is up to date.');
        return;
    }
    if (check) {
        console.error(`sitemap.xml is out of date (${changes.length} URLs). Run: node scripts/update-sitemap-lastmod.js`);
        process.exit(1);
    }
    fs.writeFileSync(SITEMAP, after);
    console.log(`Updated ${changes.length} of ${plan.length} URLs.`);
}

module.exports = { fileOf, planLastmods, applyLastmods };

if (require.main === module) main();
