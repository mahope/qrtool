// Pure budget checks for the quality job. Each function takes measured results
// and returns a list of human-readable failures (empty means green).

// known maps a page path to a baseline ({ minAccessibility, maxJsBytes }) that
// replaces the budget for that page until the page is fixed. CLS has no
// baseline: it is within budget everywhere.
export function checkLighthouse(runs, budget, known = {}) {
  const failures = [];
  for (const r of runs) {
    const base = known[r.path] || {};
    const minAccessibility = base.minAccessibility ?? budget.minAccessibility;
    const maxJsBytes = base.maxJsBytes ?? budget.maxHomeJsBytes;
    if (r.cls > budget.maxCls) {
      failures.push(`${r.path}: CLS ${r.cls.toFixed(3)} is above the budget ${budget.maxCls}`);
    }
    if (r.accessibility < minAccessibility) {
      failures.push(`${r.path}: Lighthouse accessibility ${r.accessibility} is below the budget ${minAccessibility}`);
    }
    if (r.path === '/' && r.jsBytes > maxJsBytes) {
      failures.push(`${r.path}: JavaScript transferred ${r.jsBytes} B is above the budget ${maxJsBytes} B`);
    }
  }
  return failures;
}

// knownOverflow maps "<path>@<width>" to the horizontal overflow (px) that is
// accepted until it is fixed. Everything else must not scroll sideways.
export function checkOverflow(results, knownOverflow = {}) {
  const failures = [];
  for (const r of results) {
    const allowed = knownOverflow[`${r.path}@${r.width}`] ?? 0;
    if (r.overflowPx > allowed) {
      failures.push(`${r.path}: ${r.overflowPx}px horizontal overflow at ${r.width}px wide (allowed ${allowed}px)`);
    }
  }
  return failures;
}

// knownAxe maps "<path>|<rule id>" to the number of nodes accepted on that page
// (summed over widths and themes) until it is fixed. Per page, so a fix on one
// page cannot hide a new violation on another.
export function checkAxe(results, budget, knownAxe = {}) {
  const totals = {};
  for (const r of results) {
    for (const v of r.violations) {
      if (!budget.failImpacts.includes(v.impact)) continue;
      const key = `${r.path}|${v.id}`;
      const t = (totals[key] ||= { nodes: 0, impact: v.impact });
      t.nodes += v.nodes;
    }
  }
  const failures = [];
  for (const [key, t] of Object.entries(totals)) {
    const allowed = knownAxe[key] ?? 0;
    if (t.nodes > allowed) {
      const [page, id] = key.split('|');
      failures.push(`axe ${id} (${t.impact}) on ${page}: ${t.nodes} nodes (allowed ${allowed})`);
    }
  }
  return failures;
}
