# SEO plan and implementation status: issue #5

Partially implemented. No deployment or production changes authorized.
Audited against `origin/master` at `867bfeb` on 2026-11-01. The issue API returned
HTTP 403. The supplied description ends during task 4; recover the full brief
before treating any additional details of tasks 5–7 as agreed scope.

## Goal and historical evidence

Aim for positions 10–15, eventually top 10, for Danish generator and scanner
queries. This is a target, not a promise. The issue's 18 October DataForSEO
snapshot is historical evidence, not a fresh measurement. Main demand is about
18,000 searches/month after grouping close variants: do not sum keyword rows.
Missing long-tail data is not zero demand. The reported profile contains no
verified earned external links.

Keep generation on `/` and scanning on `/scan-qr-kode`. Keep logo, file-format
and how-to intent in homepage sections. Mirror changes in English without
assuming Danish demand estimates apply to English queries.

## Implementation audit

| Task | Repository evidence | Outstanding |
| --- | --- | --- |
| 1. Homepage | DA/EN search-led titles and H1, no-login/no-expiry introduction, trust points, normalized canonical, corrected organization and free/language schema already present; generic explainer and superlative removed | Verify deployed revision after an authorized release |
| 2. Scanner | Homepage teaser and site-wide footer links already present; this branch makes the existing camera-first mobile instructions explicit in the DA/EN H2 | GSC query-to-page check and indexing request; navigation coverage needs a separate audit |
| 3. Technical | Existing git-history sitemap updater and tests; this branch validates inline JavaScript and JSON data blocks on all source pages | DNS/www, HTTPS and HTML redirects require approval; browser reproduction of reported console error remains open |
| 4. Sections | DA/EN logo, PNG/SVG/PDF, how-to and static/dynamic sections with internal links and tests already exist | Do not duplicate them |
| 5. Portfolio links/byline | No external sites changed | Recover full brief and agree placement before publication |
| 6. Template asset/outreach | Restaurant/event guides already contain printable examples | Recover full brief; select audience, format and distribution before building a separate asset; no outreach sent |
| 7. Landing pages | No speculative pages added | GSC intent evidence first, including MobilePay and supported payment behavior |

Existing scanner-link tests guard the hand-copied footers against omissions.
No second footer system is introduced. Inline syntax checks treat JSON-LD and
speculation rules as JSON. These checks do not prove that third-party scripts,
cached assets or runtime behavior are error-free. The reported console error
was not reproduced by source parsing and is not declared fixed.

## Measurement procedure after an authorized release

1. Record release date and full commit SHA. Export GSC Search results for Denmark,
   web search, with query, page, device, date, clicks, impressions, CTR and position.
   Use the preceding complete 28 days as baseline. Keep the 11 October snapshot
   (729 homepage impressions, 31 clicks, 4.3% CTR, position 14.5) separate: its
   complete reporting window is not specified in the issue.
2. Group generator queries (`qr kode`, `qr-kodegenerator`, `qr kode generator`,
   `lav qr kode`, `gratis qr kode`) and scanner queries (`scan qr kode`,
   `qr scanner`, `qr kode scanner`). Inspect query-to-page pairs for competing
   landing pages. A site-wide average is not one query's rank.
3. Verify deployed canonical HTML and sitemap, then request indexing for the
   homepage and scanner URL. Compare equal 28-day windows after four complete
   weeks. Preserve the scanner title pending that evidence.
4. At four and eight weeks, report clicks, impressions, CTR and position per
   cluster, landing page and priority query, split by device. Annotate small
   samples and other releases. If impressions are absent, check indexing and
   canonical selection before rewriting titles; if present but rankings remain
   weak, inspect intent and snippets before adding pages or text.

The issue's illustrative CTR range of 1.5–3% at positions 6–10 would yield
270–540 clicks/month only if all 18,000 relevant impressions were captured.
This is sensitivity arithmetic, not a forecast. Actual impressions, coverage,
SERP features and ranking distribution are unknown. Measure the scanner cluster
separately; do not add overlapping query volumes.

## Approval and access boundaries

Do not edit nginx, `.htaccess`, Docker routing, DNS or Dokploy domains without
the explicit approval required by `CLAUDE.md`. A later routing change must check
`/en`, `/guides`, `/en/guides`, clean URLs, HTML aliases, service-worker precache
and internal links together, then verify one-hop HTTPS redirects and successful
canonical destinations. None of those configuration changes are included here.

GSC access, the complete issue brief and a template-asset decision remain
required. External publication and outreach require separate authorization.
Issue #5 remains open; the final commit uses `Del af #5`.

## Branch validation

`npm test` built the site and passed all 348 tests (0 failures). No packages
were added or installed. `git diff --check` passed. There is no separate lint
command in this repository. Local Chromium screenshots were captured before
and after at widths 375 and 1440 for both languages in
`/tmp/qrtool-{da,en}-{before,after}-{375,1440}.png`. The Danish mobile heading
wraps without clipping; the English desktop heading fits. These isolated static
captures check the text layout only, not camera permissions, scanning, themes,
external analytics or service-worker behavior. Production was not tested.
After committing the page edits, `node scripts/update-sitemap-lastmod.js`
reported `sitemap.xml is up to date.` The existing dates already match the
content commit date, so no artificial sitemap change was made. All four
sitemap-specific tests also passed.

Suggested PR title: `Complete the SEO implementation audit and mobile scanner headings`.

Suggested PR description: Clarify the DA/EN scanner headings and add a source-wide
inline-script syntax guard. Record existing SEO implementation, measurement
steps and outstanding approval/access dependencies. Build and 348 tests pass.
No deployment, DNS, routing changes or production-data writes. Del af #5.
