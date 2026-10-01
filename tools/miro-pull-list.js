#!/usr/bin/env node
// Miro board "Assembly stills" (uXjVHg9x64k=) → worlds/pride-and-prejudice/_import/miro-assembly/<name>.png
// Signed URLs expire ~2 h after they were issued (2026-09-30 ~08:00 Istanbul). Run: node tools/miro-pull.js
const fs = require('fs'), path = require('path'), https = require('https');
const LIST = process.argv[2] || path.join(__dirname, 'miro-pull-2.txt');
const OUT = path.join(__dirname, '..', 'worlds', 'pride-and-prejudice', '_import', process.argv[3] || 'miro-assembly-A');
fs.mkdirSync(OUT, { recursive: true });
const U = fs.readFileSync(LIST, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => /^https:/.test(s));
const nameOf = u => decodeURIComponent((u.match(/filename%3D%22([^%]+(?:%[0-9A-F]{2}[^%]*)*)%22/) || [])[1] || '').replace(/_00001_/, '') || ('img' + Date.now() + '.png');
function get(u, dest, n = 0) { return new Promise((res, rej) => { https.get(u, r => {
  if ([301, 302, 303, 307, 308].includes(r.statusCode) && n < 5) { r.resume(); return get(r.headers.location, dest, n + 1).then(res, rej); }
  if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
  const w = fs.createWriteStream(dest); r.pipe(w); w.on('finish', () => w.close(res)); w.on('error', rej); }).on('error', rej); }); }
(async () => { let ok = 0, bad = 0;
  for (const u of U) { const name = nameOf(u); const dest = path.join(OUT, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { console.log('skip', name); ok++; continue; }
    try { await get(u, dest); console.log('ok  ', name, Math.round(fs.statSync(dest).size / 1024) + ' KB'); ok++; }
    catch (e) { console.log('FAIL', name, e.message); bad++; } }
  console.log(`\n${ok} ok, ${bad} failed → ${OUT}`); })();
