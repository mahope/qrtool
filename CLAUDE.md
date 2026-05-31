# CLAUDE.md

This file is a contract for Claude Code working in this repository. Follow it exactly.

## Project Overview

QR Tool is a free, client-side QR-code generator (text/URL, WiFi, vCard, email, SMS, calendar) with logo support, color customization and batch generation. It is a static multi-page website with a Danish UI and an English (`en/`) variant — no backend, all generation happens in the browser.

- Production URL: `<PRODUCTION_URL>` (README/package.json reference `https://qrtool.dk`)
- ⚠️ TODO: confirm deploy target — no matching Dokploy application was found via MCP search (`dokploy.json` declares a static deployment; verify the actual host/branch/auto-deploy before relying on this).
- Stack: vanilla HTML/CSS/JS, `qrcode` + `file-saver` + bundled `lib/` (jsQR, JSZip), built/minified with esbuild via `build.js`, served by nginx (Docker).

## Commands

- `npm start` — serve locally with http-server on port 8080 (`npx http-server -p 8080 -o`).
- `npm run build` — run `build.js`: clean `dist/`, copy site assets, minify CSS/JS with esbuild. Output in `dist/`.
- `npm test` — currently a no-op (`echo "No tests configured"`). There is no real test suite.

## Architecture

- `index.html` and the `*-qr-kode.html` pages — one page per QR type (wifi, vcard, email, sms, kalender, tekst); each is a standalone HTML page.
- `app.js` — main client logic (QR generation, customization, batch, history via localStorage, live preview, theme toggle).
- `style.css` — site styles. `sw.js` — service worker (PWA, also `manifest.json`).
- `lib/` — third-party libs: `qrcode.js`, `jsQR.min.js`, `jszip.min.js`.
- `en/` — full English mirror of the site (about, policies, guides, per-type pages).
- `guides/` — content/SEO guide pages (Danish).
- `build.js` — build script; copies a fixed list of assets to `dist/` then minifies.
- `Dockerfile` + `nginx.conf` — multi-stage build (node build → nginx serve `dist/`). `dokploy.json` declares the Dokploy static deployment and domains.
- Static SEO/PWA assets: `sitemap.xml`, `robots.txt`, `manifest.json`, `icon.svg`, `ads.txt`, `404.html`, `.htaccess`.

## Deploy

⚠️ TODO: confirm deploy target — no Dokploy application matched this repo via MCP search, so the deploy pipeline below is unverified.

Once confirmed, the expected flow is: push to the production branch → Dokploy builds the Docker image (`npm run build` → nginx) → verify on production. Steps:
1. Stage only the specific files you changed (never `git add .`).
2. Commit with an English imperative message; push to the production branch.
3. Watch the Dokploy build/deploy log to completion.
4. Verify: `curl -fsI https://<host>/` must return 200. A deploy is not done until verified on production.

## Language

- Code, identifiers, file names, and comments: English.
- User-facing content: Danish (with an English mirror under `en/`). Keep both language variants in sync when changing UI text.
- Commit messages: English, imperative mood.

## Do Not

- Do not `git push --force` on the default branch (`master`).
- Do not use `git add .` or `git commit -a` — stage only the files you intentionally changed.
- Do not add new npm packages or CDN dependencies without asking first.
- Never commit secrets (API keys, tokens, credentials) to any file.
- Do not edit files in `dist/` by hand — it is build output; change the source files and run `npm run build`.
- Do not commit local screenshots, `.playwright-mcp/`, or other working-tree artifacts.
- When changing UI strings, do not update only one language — update both the Danish page and its `en/` counterpart.

## Danger Zones

These have real, hard-to-reverse effects. Get an explicit "yes" before doing any of them:
- Force-pushing or rewriting history on the default branch.
- Changing DNS, the Dokploy domain config, or `dokploy.json` domains (`qrtool.dk` / `www.qrtool.dk`).
- Editing `nginx.conf`, `.htaccess`, or the `Dockerfile` in ways that affect routing, caching, or security headers in production.
- Triggering a production deploy (see ⚠️ TODO above — confirm the target first).

GDPR note: QR content (including WiFi passwords, vCard contact details, emails, SMS) is processed entirely client-side and is not sent to a server. Keep it that way — do not add any tracking, logging, or backend transmission of user-entered QR data without an explicit decision and privacy-policy update.
