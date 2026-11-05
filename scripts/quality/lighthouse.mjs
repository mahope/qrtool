import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromeExecutable, chromeFlags } from './browser.mjs';

// The CLI runs as a child process; it must not block this process, because
// the static server lives here and has to answer Lighthouse's requests.
function runCli(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'ignore', 'pipe'], env });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr = (stderr + d).slice(-2500); });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stderr }));
  });
}

// Lighthouse mobile preset (its default) on each page, one run per page.
// The page list lives in budgets.json.
export async function runLighthouse(origin, pages) {
  const bin = path.resolve('node_modules/lighthouse/cli/index.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrtool-lh-'));
  const chrome = chromeExecutable();
  const runs = [];
  try {
    for (const p of pages) {
      const out = path.join(dir, `${p.replace(/\W+/g, '_')}.json`);
      const args = [
        bin, origin + p, '--quiet', '--output=json', `--output-path=${out}`,
        '--only-categories=performance,accessibility',
        `--chrome-flags=${chromeFlags().join(' ')}`,
      ];
      // The Lighthouse CLI finds Chrome through CHROME_PATH (it has no --chrome-path flag).
      const r = await runCli(args, chrome ? { ...process.env, CHROME_PATH: chrome } : process.env);
      if (r.code !== 0 || !fs.existsSync(out)) {
        throw new Error(`Lighthouse failed for ${p}: ${r.stderr}`);
      }
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      const script = (j.audits['resource-summary'].details.items || []).find((i) => i.resourceType === 'script');
      runs.push({
        path: p,
        cls: j.audits['cumulative-layout-shift'].numericValue,
        accessibility: Math.round(j.categories.accessibility.score * 100),
        performance: Math.round(j.categories.performance.score * 100),
        jsBytes: script ? script.transferSize : 0,
      });
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return runs;
}
