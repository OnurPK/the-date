#!/usr/bin/env node
// Standalone server for review.html (annotated screenshots → _shots/<name>.png + .json). No dependencies.
//   node tools/review-server.js [port]      → http://localhost:8765/review.html
// Serves the project folder statically (so review.html and any screenshots load) and accepts POST /api/review/save.
// Claude reads _shots/*.json (pins: n, x, y, text) + the .png and answers pin by pin.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = parseInt(process.argv[2] || process.env.REVIEW_PORT || '8765', 10);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
const send = (res, code, body, type) => { res.writeHead(code, { 'content-type': type || 'application/json', 'access-control-allow-origin': '*' }); res.end(body); };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api/review/save') {
    let raw = ''; req.on('data', c => { raw += c; if (raw.length > 60e6) req.destroy(); }); await new Promise(r => req.on('end', r));
    let b; try { b = JSON.parse(raw || '{}'); } catch (e) { return send(res, 400, '{"error":"bad json"}'); }
    const dir = path.join(ROOT, '_shots'); fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const base = String(b.name || '').trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'review';
    const name = b.overwrite ? base : base + '-' + stamp;
    const m = /^data:image\/png;base64,(.+)$/.exec(String(b.png || '')); if (!m) return send(res, 400, '{"error":"png required"}');
    fs.writeFileSync(path.join(dir, name + '.png'), Buffer.from(m[1], 'base64'));
    fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify({ name, title: b.title || '', notes: b.notes || [], size: b.size || null, createdAt: new Date().toISOString() }, null, 2));
    return send(res, 200, JSON.stringify({ ok: true, name, file: '_shots/' + name + '.png' }));
  }
  if (req.method === 'GET' && url.pathname === '/api/review/list') {
    const dir = path.join(ROOT, '_shots'); let out = [];
    try { out = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse().map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
    return send(res, 200, JSON.stringify(out));
  }
  // static
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/review.html';
  const abs = path.join(ROOT, p); if (!abs.startsWith(ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return send(res, 404, 'not found', 'text/plain');
  res.writeHead(200, { 'content-type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(abs).pipe(res);
}).listen(PORT, () => console.log('review → http://localhost:' + PORT + '/review.html   (saves to ' + path.join(ROOT, '_shots') + ')'));
