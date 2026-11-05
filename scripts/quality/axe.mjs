import AxeBuilder from '@axe-core/playwright';

export const AXE_PAGES = ['/', '/wifi-qr-kode', '/vcard-qr-kode', '/scan-qr-kode', '/guides/', '/guides/qr-koder-til-restauranter', '/om-qr-tool', '/404-findes-ikke', '/en/'];
const VIEWPORTS = [[390, 844], [1440, 900]];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(browser, origin, p, [width, height], theme) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'da-DK', reducedMotion: 'reduce' });
  try {
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('onboarding-done', '1'); } catch { /* storage blocked */ } });
    await page.goto(origin + p, { waitUntil: 'load' });
    // Contrast is computed from live colors: freeze transitions so a scan
    // never sees a half-faded color.
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await page.waitForTimeout(500);
    if (theme === 'toggled') {
      const toggle = await page.$('#themeToggle');
      if (!toggle || !(await toggle.isVisible())) return null;
      await toggle.click();
      await page.waitForTimeout(500);
    }
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    return {
      path: p, width, theme,
      violations: r.violations.map((v) => ({
        id: v.id, impact: v.impact, nodes: v.nodes.length,
        sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ').slice(0, 140),
      })),
    };
  } finally {
    await ctx.close();
  }
}

// Runs axe on each page at a phone and a desktop width, with the default theme
// and with the theme toggled (when the page has a toggle).
export async function runAxe(browser, origin, limit, pages = AXE_PAGES) {
  const jobs = [];
  for (const vp of VIEWPORTS) {
    for (const theme of ['default', 'toggled']) {
      for (const p of pages) jobs.push(limit(() => scan(browser, origin, p, vp, theme)));
    }
  }
  return (await Promise.all(jobs)).filter(Boolean);
}
