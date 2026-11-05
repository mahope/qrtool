# Vendored libraries

Three third-party libraries are copied into `lib/` and shipped as is. They are not npm dependencies, so Renovate cannot update them. Check upstream for security fixes by hand.

All three files were added in commit "perf: Self-host all JavaScript libraries (#54)" on 2026-02-17. Versions were found on 2026-11-05 by comparing the files byte for byte with the published npm tarballs.

| File | Library | Version | Source | License |
|------|---------|---------|--------|---------|
| `lib/qrcode.js` | QR Code Generator for JavaScript (Kazuhiko Arase), npm `qrcode-generator` | 2.0.4 (identical to `dist/qrcode.js` in the package) | https://github.com/kazuhikoarase/qrcode-generator | MIT |
| `lib/jsQR.min.js` | jsQR (cozmo), npm `jsqr` | 1.4.0 (identical to `dist/jsQR.js` in the package) | https://github.com/cozmo/jsQR | Apache-2.0 |
| `lib/jszip.min.js` | JSZip (Stuart Knightley), npm `jszip` | 3.10.1 (identical to `dist/jszip.min.js` in the package) | https://github.com/Stuk/jszip | MIT or GPL-3.0-or-later (dual) |

Notes:

- `lib/qrcode.js` is not the npm package `qrcode`. That package was an unused dependency and has been removed.
- Apache-2.0 asks that redistributed copies come with a copy of the license. `lib/jsQR.min.js` carries no license text. Whether to add one is an open decision, and it is not done here.
- Upgrading any of the three is a separate choice. Update this file when you do.
