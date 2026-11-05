// Chrome selection shared by the Playwright checks and Lighthouse.
// QUALITY_CHROME (set by the workflow) wins, then CHROME_PATH. With neither,
// Playwright uses its own default browser.
import fs from 'node:fs';
import { chromium } from 'playwright';

export function chromeExecutable() {
  return process.env.QUALITY_CHROME || process.env.CHROME_PATH || undefined;
}

export function launchBrowser() {
  const executablePath = chromeExecutable();
  return chromium.launch(executablePath ? { executablePath } : {});
}

// Chrome refuses to start its sandbox as root and often without user namespaces
// in CI containers, and /dev/shm is small there: CI (and root) get the usual flags.
export function chromeFlags() {
  const flags = ['--headless=new'];
  const root = typeof process.getuid === 'function' && process.getuid() === 0;
  if (root || process.env.CI) flags.push('--no-sandbox', '--disable-dev-shm-usage');
  return flags;
}

export function sitemapPaths(sitemapFile) {
  const xml = fs.readFileSync(sitemapFile, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

// Runs async tasks at most n at a time; shared by the page checks so they can
// run side by side without overloading the machine.
export function createLimiter(n) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= n || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => { active--; next(); });
  };
  return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}
