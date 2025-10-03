# QR Tool - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Files Ready for Production
- [x] index.html - Main generator page
- [x] wifi-qr-kode.html - WiFi QR landing page
- [x] 404.html - Error page
- [x] style.css - All styling
- [x] app.js - All JavaScript functionality
- [x] sitemap.xml - SEO sitemap
- [x] robots.txt - Search engine directives
- [x] .htaccess - Apache server configuration
- [x] README.md - Documentation
- [x] package.json - Dependencies info

### 🔍 Pre-Launch Testing

#### Functionality Tests
- [ ] Test basic text/URL QR generation
- [ ] Test WiFi QR code generation
- [ ] Test vCard QR code generation
- [ ] Test Email QR code generation
- [ ] Test SMS QR code generation
- [ ] Test Calendar QR code generation
- [ ] Test logo upload functionality
- [ ] Test all QR styles (square, rounded, dots)
- [ ] Test batch generation (create 5+ QR codes)
- [ ] Test download in all formats (PNG, JPG, SVG, WebP)
- [ ] Test history save/load/delete functionality
- [ ] Test theme toggle (dark/light mode)

#### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

#### SEO & Performance
- [ ] Meta tags present on all pages
- [ ] Open Graph tags working
- [ ] Schema.org structured data valid
- [ ] Sitemap accessible at /sitemap.xml
- [ ] robots.txt accessible at /robots.txt
- [ ] 404 page displays correctly
- [ ] All internal links work
- [ ] External links open in new tab

#### Security
- [ ] HTTPS enabled
- [ ] Security headers configured (.htaccess)
- [ ] No sensitive data in client-side code
- [ ] No console errors in production

## 🚀 Deployment Steps

### Step 1: Upload Files to Server

Upload all files to your web server (via FTP, SFTP, or hosting panel):

```
qrtool.dk/
├── index.html
├── wifi-qr-kode.html
├── 404.html
├── style.css
├── app.js
├── sitemap.xml
├── robots.txt
├── .htaccess
├── package.json
└── README.md
```

**DO NOT upload:**
- node_modules/ (CDN links are used instead)
- .git/ (if exists)
- DEPLOYMENT.md (internal documentation)

### Step 2: DNS Configuration

Point your domain to the server:
- A record: qrtool.dk → [SERVER_IP]
- CNAME record (optional): www.qrtool.dk → qrtool.dk

### Step 3: SSL Certificate

Ensure HTTPS is enabled:
- Use Let's Encrypt (free) or your hosting provider's SSL
- Force HTTPS redirect (already in .htaccess)
- Test with: https://www.ssllabs.com/ssltest/

### Step 4: Test Production Site

Visit https://qrtool.dk and verify:
- [ ] Homepage loads correctly
- [ ] Generate a QR code successfully
- [ ] Download works
- [ ] WiFi landing page accessible: /wifi-qr-kode
- [ ] 404 page shows for invalid URLs
- [ ] All external scripts load (check console)

### Step 5: Submit to Search Engines

**Google Search Console:**
1. Go to https://search.google.com/search-console
2. Add property: qrtool.dk
3. Verify ownership (HTML tag method)
4. Submit sitemap: https://qrtool.dk/sitemap.xml

**Bing Webmaster Tools:**
1. Go to https://www.bing.com/webmasters
2. Add site: qrtool.dk
3. Verify ownership
4. Submit sitemap

### Step 6: Performance Optimization

**Test Performance:**
- Google PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

**Optimization Tips (if needed):**
- Images: Already using SVG and optimized formats
- Compression: Enabled in .htaccess (gzip)
- Caching: Configured in .htaccess
- CDN: Consider Cloudflare for global distribution

### Step 7: Analytics (Optional)

Add Google Analytics or similar:
1. Create GA4 property
2. Add tracking code to index.html (before </head>)
3. Update Content-Security-Policy in .htaccess to allow analytics

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 📊 Post-Launch Monitoring

### Week 1
- [ ] Monitor Google Search Console for crawl errors
- [ ] Check analytics for traffic
- [ ] Test QR codes generated from live site
- [ ] Monitor uptime

### Month 1
- [ ] Review search rankings
- [ ] Analyze user behavior
- [ ] Collect user feedback
- [ ] Fix any reported bugs

## 🔧 Maintenance

### Regular Tasks
- **Weekly:** Check for broken links
- **Monthly:** Review analytics and SEO performance
- **Quarterly:** Update dependencies and libraries
- **As needed:** Add new features based on user feedback

### Updating Content
To update SEO content:
1. Edit index.html or wifi-qr-kode.html
2. Update <lastmod> date in sitemap.xml
3. Upload changed files via FTP/SFTP
4. Clear browser cache and test

### Adding New Landing Pages
1. Create new HTML file (e.g., vcard-qr-kode.html)
2. Add entry to sitemap.xml
3. Update footer links on all pages
4. Submit updated sitemap to search engines

## 🐛 Troubleshooting

### QR Code Not Generating
- Check browser console for JavaScript errors
- Verify CDN scripts are loading (qrcode.js, jszip.js)
- Test in different browser

### .htaccess Not Working
- Verify mod_rewrite is enabled on server
- Check file permissions (644)
- Review server error logs

### HTTPS Redirect Loop
- Check .htaccess RewriteCond rules
- Verify SSL certificate is installed
- Contact hosting provider if issues persist

## 📱 Social Media

After launch, share on:
- LinkedIn (business audience)
- Twitter/X (tech audience)
- Facebook (general audience)
- Reddit (r/webdev, r/freebies)

**Sample Post:**
"🎉 Lancerer QR Tool - Danmarks mest avancerede GRATIS QR-kode generator!
✅ WiFi QR-koder
✅ Digitale visitkort (vCard)
✅ Logo integration
✅ Batch generering
Check it out: https://qrtool.dk"

## 📈 SEO Keywords to Target

Primary keywords:
- qr kode generator
- gratis qr kode
- wifi qr kode
- qr kode med logo
- vcard qr kode

Long-tail keywords:
- hvordan laver man en qr kode
- gratis qr kode generator dansk
- wifi qr kode til restaurant
- qr kode til visitkort
- batch qr kode generator

## ✅ Launch Checklist Summary

Before going live:
- [x] All files uploaded
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Test all functionality
- [ ] Submit to search engines
- [ ] Add analytics (optional)
- [ ] Social media announcement prepared

---

**Lavet af Mahope.dk** - Webudvikling og digitale løsninger
https://mahope.dk

For support eller spørgsmål, kontakt via Mahope.dk
