# Content Security Policy (report-only)

`nginx.conf` sends two policies. The old `Content-Security-Policy` is enforced. The stricter
`Content-Security-Policy-Report-Only` (issue #50) blocks nothing; the browser POSTs each violation
to `/csp-report`, and nginx appends it as one JSON line to `/var/log/nginx/csp-report.log`.

What the policy allows (collected by `scripts/csp-audit.mjs` across every sitemap page, QR
generation, all download formats, logo upload, batch ZIP, scanning from an image and from the
camera, geolocation, and the service worker incl. offline):

- scripts: `'self'`, inline (see below), speculation rules, and the two analytics hosts
- styles: `'self'` and inline (8 pages have a `<style>` block, many elements use `style=""`)
- images `'self' data: blob:`, fonts `'self'`, connect `'self'` + analytics, worker/manifest `'self'`
- everything else (`default-src`, frames, objects) `'none'`; `base-uri`, `form-action` and `frame-ancestors` `'self'`

Known gap: `script-src` still has `'unsafe-inline'`, because ~20 pages carry page-specific inline
scripts. Dropping it means moving those into files (or hashing them at build time).

## Check the log

```
docker exec <qrtool-container> sh -c 'wc -l < /var/log/nginx/csp-report.log; tail -n 50 /var/log/nginx/csp-report.log'
```

Count by violated directive (empty output means no violations):

```
docker exec <qrtool-container> cat /var/log/nginx/csp-report.log | jq -r '.report | fromjson? | (."csp-report"["effective-directive"] // .[0].body.effectiveDirective)' | sort | uniq -c
```

## Run the audit locally

```
npm run build && node scripts/csp-audit.mjs
```

CI runs the same audit in `test/csp-report-only.test.js` and fails on any violation.
