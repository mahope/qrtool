export const OVERFLOW_WIDTHS = [320, 390];

async function measure(browser, origin, p, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 740 }, locale: 'da-DK' });
  try {
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('onboarding-done', '1'); } catch { /* storage blocked */ } });
    await page.goto(origin + p, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: window.innerWidth }));
    return { path: p, width, overflowPx: Math.max(0, m.docW - m.vw) };
  } finally {
    await ctx.close();
  }
}

// Horizontal overflow: document scrollWidth against the window width, in a
// non-mobile context of exactly that width so nothing is hidden by the
// browser widening the layout viewport.
export function runOverflow(browser, origin, limit, paths, widths = OVERFLOW_WIDTHS) {
  const jobs = [];
  for (const width of widths) for (const p of paths) jobs.push(limit(() => measure(browser, origin, p, width)));
  return Promise.all(jobs);
}
