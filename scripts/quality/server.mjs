// Minimal static server for dist/ that mirrors the nginx routing (try_files
// $uri $uri.html $uri/, 404.html on miss) and gzips text, so transfer sizes
// are close to production.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};
const GZIP = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

function resolveFile(root, pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  const base = path.resolve(root, rel);
  if (base !== root && !base.startsWith(root + path.sep)) return null;
  const candidates = [base, `${base}.html`, path.join(base, 'index.html')];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// options.headers are added to every response; options.handler(req, res) may
// answer a request itself (return true) before the static lookup.
export function startServer(distDir, port = 0, options = {}) {
  const root = path.resolve(distDir);
  const extraHeaders = options.headers || {};
  const server = http.createServer((req, res) => {
    if (options.handler && options.handler(req, res)) return;
    const { pathname } = new URL(req.url, 'http://localhost');
    let file = resolveFile(root, pathname);
    let status = 200;
    if (!file) {
      file = path.join(root, '404.html');
      status = 404;
    }
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', ...extraHeaders };
    if (GZIP.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
      res.writeHead(status, headers);
      res.end(zlib.gzipSync(body));
    } else {
      res.writeHead(status, headers);
      res.end(body);
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve({ origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
