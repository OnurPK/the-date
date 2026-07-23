// Local dev server with write capability — replaces python3 -m http.server.
// Why? Editor "+ New Location" + "Save" need to write to disk so the
// scenarios become part of the real folder tree (and eventually git push).
// Browsers can't write to disk, so we proxy through this tiny Node server.
//
// Usage (from project root):
//   node dev-server.js
//   → Serves the static site at http://localhost:8000
//   → Editor saves create folders + write files automatically
//
// No external dependencies — pure Node stdlib.

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 8000;

// ───────────────────────────────────────────────────────────────
// MIME types for the static server
// ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// ───────────────────────────────────────────────────────────────
// Safety — keep writes inside the project tree
// ───────────────────────────────────────────────────────────────
function isInsideRoot(absPath) {
  const rel = path.relative(ROOT, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (chunk) => { buf += chunk; if (buf.length > 5e6) reject(new Error('payload too large')); });
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(obj));
}

// ───────────────────────────────────────────────────────────────
// API endpoints
// ───────────────────────────────────────────────────────────────

// POST /api/save-venue
//   Body: { pack, venueId, title, kind?, desc?, script }
//   Creates worlds/{pack}/locations/{venueId}/scripts/main.txt
//   Returns { ok, path }
async function handleSaveVenue(req, res) {
  const body = await readJsonBody(req);
  const pack    = String(body.pack || '').trim();
  const venueId = String(body.venueId || '').trim();
  const script  = String(body.script || '');
  if (!pack || !venueId) {
    return sendJson(res, 400, { error: 'pack + venueId required' });
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(venueId) || !/^[a-z0-9][a-z0-9_-]*$/i.test(pack)) {
    return sendJson(res, 400, { error: 'pack / venueId must be slug-safe' });
  }
  const dir = path.join(ROOT, 'worlds', pack, 'locations', venueId, 'scripts');
  if (!isInsideRoot(dir)) return sendJson(res, 403, { error: 'path escapes project root' });
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'main.txt');
  fs.writeFileSync(filePath, script);
  console.log('[save-venue]', pack, '/', venueId, '→', path.relative(ROOT, filePath));
  return sendJson(res, 200, { ok: true, path: path.relative(ROOT, filePath) });
}

// POST /api/save-script
//   Body: { path, content }    — generic: write `content` to `path`
//   Body: { pack, venueId, script } — legacy: same as save-venue
//
// Path safety: must start with "worlds/" and not contain ".." or
// resolve outside the project root. Auto-creates parent folders.
async function handleSaveScript(req, res) {
  const body = await readJsonBody(req);
  // Legacy: { pack, venueId, script } → forward to save-venue logic.
  if (body && body.pack && body.venueId) {
    // Re-emit the data so handleSaveVenue can re-read it. Simpler: just
    // build the path here.
    const pack    = String(body.pack).trim();
    const venueId = String(body.venueId).trim();
    body.path = `worlds/${pack}/locations/${venueId}/scripts/main.txt`;
    body.content = body.script;
  }
  const relPath = String(body.path || '').trim();
  const content = String(body.content != null ? body.content : '');
  if (!relPath) return sendJson(res, 400, { error: 'path required' });
  // Path safety — only allow writes under worlds/ to keep the user
  // from accidentally clobbering source files.
  if (!/^worlds\/[a-z0-9_/.-]+\.(txt|md|json)$/i.test(relPath)) {
    return sendJson(res, 400, { error: 'path must be under worlds/ and end in .txt/.md/.json' });
  }
  const abs = path.join(ROOT, relPath);
  if (!isInsideRoot(abs)) return sendJson(res, 403, { error: 'path escapes project root' });
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log('[save-script]', relPath);
  return sendJson(res, 200, { ok: true, path: relPath });
}

// GET /api/list-venues
//   Returns { venues: [{ pack, venueId }] } from the worlds/ tree.
function handleListVenues(req, res) {
  const out = [];
  const worldsDir = path.join(ROOT, 'worlds');
  if (fs.existsSync(worldsDir)) {
    for (const pack of fs.readdirSync(worldsDir)) {
      const locDir = path.join(worldsDir, pack, 'locations');
      if (!fs.existsSync(locDir)) continue;
      for (const venueId of fs.readdirSync(locDir)) {
        const scriptPath = path.join(locDir, venueId, 'scripts', 'main.txt');
        if (fs.existsSync(scriptPath)) out.push({ pack, venueId });
      }
    }
  }
  return sendJson(res, 200, { venues: out });
}

// ───────────────────────────────────────────────────────────────
// Static file server fallback
// ───────────────────────────────────────────────────────────────
function serveStatic(req, res, parsed) {
  let filePath = path.join(ROOT, decodeURIComponent(parsed.pathname));
  if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');
  if (!isInsideRoot(filePath)) {
    res.writeHead(403); return res.end('forbidden');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Try index.html for directory-ish paths
      if (!err && stat.isDirectory()) {
        const idx = path.join(filePath, 'index.html');
        return fs.stat(idx, (e2, s2) => {
          if (e2 || !s2.isFile()) { res.writeHead(404); return res.end('not found'); }
          streamFile(idx, res);
        });
      }
      res.writeHead(404);
      return res.end('not found');
    }
    streamFile(filePath, res);
  });
}

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-cache' });
  fs.createReadStream(filePath).pipe(res);
}

// ───────────────────────────────────────────────────────────────
// Router
// ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }

  try {
    if (req.method === 'POST' && parsed.pathname === '/api/save-venue') return handleSaveVenue(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/save-script') return handleSaveScript(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/list-venues') return handleListVenues(req, res);
  } catch (e) {
    return sendJson(res, 500, { error: String(e && e.message || e) });
  }

  // Default → static file
  serveStatic(req, res, parsed);
});

server.listen(PORT, () => {
  console.log(`\n  roles.ai dev server`);
  console.log(`  → http://localhost:${PORT}/`);
  console.log(`  → http://localhost:${PORT}/?dev=keys   (with dev settings)`);
  console.log(`  → http://localhost:${PORT}/editor.html (editor)\n`);
  console.log(`  Writes go to disk under ${ROOT}/worlds/\n`);
});
