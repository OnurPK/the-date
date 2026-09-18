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
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 8000;

// ── tiny .env loader (no dependency): reads KEY=VALUE lines from ./.env
// and puts them in process.env (existing env vars win). Never commit .env.
(function loadDotEnv() {
  try {
    const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    txt.split('\n').forEach(line => {
      const s = line.trim();
      if (!s || s.startsWith('#')) return;
      const i = s.indexOf('=');
      if (i < 0) return;
      const k = s.slice(0, i).trim();
      let v = s.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && process.env[k] === undefined) process.env[k] = v;
    });
    console.log('  loaded .env');
  } catch (e) { /* no .env file — fine */ }
})();

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
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
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

// GET /api/list-appearances?char=<folder>[&world=<slug>]
//   Lists appearance image names (without extension) for a character folder.
//   Used by the Line Tuner "Poses" picker to populate the sprite dropdown.
function handleListAppearances(req, res, parsed) {
  const char  = String((parsed.query.char || '')).trim();
  const world = String((parsed.query.world || 'pride-and-prejudice')).trim();
  if (!/^[a-z0-9_-]+$/i.test(char) || !/^[a-z0-9_-]+$/i.test(world)) {
    return sendJson(res, 400, { error: 'bad char/world' });
  }
  const dir = path.join(ROOT, 'worlds', world, 'characters', char, 'appearances');
  let images = [];
  try {
    if (fs.existsSync(dir)) {
      images = fs.readdirSync(dir)
        .filter(f => /\.(png|webp|jpe?g)$/i.test(f))
        .map(f => f.replace(/\.[^.]+$/, ''));
    }
  } catch (e) {}
  return sendJson(res, 200, { images });
}

// ───────────────────────────────────────────────────────────────
// Episode Author tool — OpenAI proxy (key from OPENAI_API_KEY env)
// ───────────────────────────────────────────────────────────────
const OPENAI_KEY   = process.env.OPENAI_API_KEY || '';
const CHAT_MODEL   = process.env.OPENAI_CHAT_MODEL || 'gpt-4o';
const IMAGE_MODEL  = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

function openaiJson(pathname, payload) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload));
    const req = https.request({
      hostname: 'api.openai.com', path: pathname, method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json', 'Content-Length': body.length },
    }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => {
      try { const j = JSON.parse(d); if (r.statusCode >= 400) return reject(new Error((j.error && j.error.message) || ('HTTP ' + r.statusCode))); resolve(j); }
      catch (e) { reject(new Error('bad response: ' + d.slice(0, 200))); }
    }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

// multipart POST for the images/edits endpoint (with one or more reference images)
const OPENAI_IMAGE_MODELS = new Set(['gpt-image-1', 'gpt-image-2', 'gpt-image-2.5-flare', 'gpt-image-2.5-sunburst']);
// Server-wide image default, set from the editor's model picker (persisted, gitignored).
// Resolution order: request.model → this file → OPENAI_IMAGE_MODEL (.env) → gpt-image-2.
const IMG_PREF_PATH = path.join(ROOT, '_config', 'image-model.local.json');
function readImgPref() { try { return JSON.parse(fs.readFileSync(IMG_PREF_PATH, 'utf8')); } catch (e) { return {}; } }
function writeImgPref(o) { fs.mkdirSync(path.dirname(IMG_PREF_PATH), { recursive: true }); fs.writeFileSync(IMG_PREF_PATH, JSON.stringify(o, null, 2)); }
function imgPrefProvider() { const p = readImgPref(); return p.provider === 'freepik' ? 'freepik' : 'openai'; }
function pickImageModel(m) { m = String(m || '').trim(); if (OPENAI_IMAGE_MODELS.has(m)) return m;
  const p = readImgPref(); return OPENAI_IMAGE_MODELS.has(p.model) ? p.model : IMAGE_MODEL; }
// GET /api/image-model → current default; POST {provider, model} → set it
async function handleImageModel(req, res) {
  if (req.method === 'POST') {
    const b = await readJsonBody(req);
    const provider = b.provider === 'freepik' ? 'freepik' : 'openai';
    const model = OPENAI_IMAGE_MODELS.has(String(b.model || '')) ? String(b.model) : null;
    writeImgPref({ provider, model, updated: new Date().toISOString() });
  }
  const p = readImgPref();
  return sendJson(res, 200, { provider: imgPrefProvider(), model: p.model || null, effectiveModel: pickImageModel(null), envModel: IMAGE_MODEL, freepik: !!FREEPIK_KEY });
}
function openaiImageEdit(prompt, refAbs, size, model, opts) {
  const refList = Array.isArray(refAbs) ? refAbs : [refAbs]; opts = opts || {};
  return new Promise((resolve, reject) => {
    const boundary = '----author' + Date.now();
    const parts = [];
    const add = (s) => parts.push(Buffer.from(s));
    add(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${model || IMAGE_MODEL}\r\n`);
    if (opts.transparent) { add(`--${boundary}\r\nContent-Disposition: form-data; name="background"\r\n\r\ntransparent\r\n`); add(`--${boundary}\r\nContent-Disposition: form-data; name="output_format"\r\n\r\npng\r\n`); }
    add(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`);
    add(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}\r\n`);
    refList.forEach((p, i) => {
      add(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="ref${i}.png"\r\nContent-Type: image/png\r\n\r\n`);
      parts.push(fs.readFileSync(p)); add(`\r\n`);
    });
    add(`--${boundary}--\r\n`);
    const body = Buffer.concat(parts);
    const req = https.request({ hostname:'api.openai.com', path:'/v1/images/edits', method:'POST',
      headers:{ 'Authorization':'Bearer '+OPENAI_KEY, 'Content-Type':'multipart/form-data; boundary='+boundary, 'Content-Length':body.length } },
      (r)=>{ let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{ const j=JSON.parse(d); if(r.statusCode>=400) return reject(new Error((j.error&&j.error.message)||('HTTP '+r.statusCode))); resolve(j); }catch(e){ reject(new Error('bad img response')); } }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

const DSL_SPEC = `You write scripts for a Regency visual-novel engine (Pride & Prejudice world). Output ONLY the script text, no markdown, no explanation.

FORMAT (one directive/line per line):
(Situation: id | Title | one-line description)   // start a beat; id = lowercase_snake
[bg:explore=FILE.png]     // room backdrop (a location image)
[bg:cutscene=FILE.png]    // full dramatic still
[bg:intro=intro.png]      // the episode's FIRST scene (opening cinematic still) — renders like a cutscene
[bg:ending=ending.png]    // the episode's LAST scene (closing cinematic still) — renders like a cutscene
[ui:cast layout=convo_two]   // two people present, shot/reverse (only speaker shown)
[ui:cast layout=convo_three] // three people present
[cast: left=FOLDER center=FOLDER right=FOLDER]  // who is on stage (character folder names)
[ui:bubble]   // caption/aside over a cutscene
Speaker: dialogue text        // Speaker is a hyphenated key (e.g. Arabella, Sir-Henry, Mrs-Frost)
(Choice:3)                    // a 3-way player choice; the next 3 lines are the options
Arabella: option text [trait: Trait Name]      // each option is an Arabella line with a trait tag; use {a|b} for word variants
// Mark exactly ONE option per (Choice) with a trailing [main] — the canon option the main storyline follows (the others exist as alternatives). e.g. "Arabella: … [trait: Empathy] [main]"
(IfChoice:0) ... (EndIf)      // block shown only if option 0 was picked
Mechanics: (Relation: FOLDER | trust|romance | +1)  (Allure: +N)  (Scandal: +N)  (Discover: FOLDER)  (Discovery: FOLDER | fact)  (XP: FOLDER | +N)  (Item: item_id)  (Trait: Name)
// EVERY (IfChoice:N) block MUST end with a Mechanics: line carrying at least one consequence code, and vary them across options: warm/earnest choices → (Relation ...)+(XP ...); bold/forward choices → (Scandal:+N) (and maybe (Allure:+N)); learning something about a suitor → (Discovery: FOLDER | fact)+(XP ...); a gift/keepsake → (Item: id). Make consequences differ per option so the choice matters.

RULES:
- SUITORS (romantic interests, and the target of any (Discover: ID) / (XP: ID | …) / (Relation: ID | …) / (Discovery: ID | …)) MUST use ONLY these exact canonical folder ids: mr_darcy, mr_bingley, mr_wickham, mr_collins, lord_ravenscar, capt_vane, ens_pryce, mr_fenwick, mr_devereux, mr_hale, mr_quill, sir_ashbourne. Never invent or misspell a suitor id (use ens_pryce, NOT ensign_pryce). If the brief names a suitor, map it to the closest id in this list.
- MINOR / background side characters (a maid, a driver, an old gentleman, a gossip) MAY use freely invented snake_case folder ids in [cast: …] lines — but they must NEVER be a suitor and must NEVER appear in a (Discover/XP/Relation/Discovery: …) code.
- The player character is Arabella (folder arabella_frost, speaker key "Arabella").
- Use hyphenated speaker keys for multi-word names (Sir-Henry, Mrs-Frost, Mr-Frost).
- Each situation: a cast beat (2-3 lines) → often a (Choice:3) with 3 IfChoice consequence beats.
- ALWAYS begin the episode with an intro situation whose backdrop is [bg:intro=intro.png] (the opening scene that sets the mood/place), and ALWAYS end with an ending situation whose backdrop is [bg:ending=ending.png] (the closing scene). These are the story's first and last scenes — write real dialogue/narration in them, they are NOT title cards. Each MUST include a [cast: ...] line naming whoever is on screen (at least arabella_frost) so their likeness is used in the generated image.
- Keep it witty, period-accurate, concise. 4-7 situations. First meeting: (Discover: <suitor_folder>) after the intro beat.
- Reference only backdrops/cutscenes that fit; invent sensible FILE.png names (snake_case).`;

// Belt-and-suspenders: coerce common non-canonical suitor folder ids the LLM
// sometimes emits into the real ids (so refs, sprites and Suitors unlock work).
const SUITOR_ID_ALIAS = { ensign_pryce:'ens_pryce', captain_vane:'capt_vane', mr_ravenscar:'lord_ravenscar' };
function normalizeSuitorIds(script) {
  let s = String(script || '');
  for (const [wrong, right] of Object.entries(SUITOR_ID_ALIAS)) {
    s = s.replace(new RegExp('\\b' + wrong + '\\b', 'g'), right);
  }
  return s;
}

async function handleAuthorScript(req, res) {
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY in the dev-server environment' });
  const b = await readJsonBody(req);
  const characters = Array.isArray(b.characters) ? b.characters : (b.suitor ? [b.suitor] : []);
  const location = String(b.location || '').trim();  // e.g. lucas-lodge
  const brief = String(b.brief || '').trim();
  if (!brief) return sendJson(res, 400, { error: 'brief required' });
  const user = `Player character: Arabella (folder arabella_frost, speaker key "Arabella") — always the lead, always present.\n`
    + `Other characters present (folders): ${characters.join(', ') || '(none extra)'}\n`
    + `Location: ${location}\nBrief: ${brief}\n\nWrite the full episode script now.`;
  try {
    const j = await openaiJson('/v1/chat/completions', {
      model: CHAT_MODEL, temperature: 0.8,
      messages: [ { role:'system', content: DSL_SPEC }, { role:'user', content: user } ],
    });
    const script = normalizeSuitorIds((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '');
    return sendJson(res, 200, { ok: true, script });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// POST /api/author/gen-asset  { relPath, prompt, ref? , size? }
//   Generates one image and writes it to relPath (under worlds/). ref = optional
//   character folder to use its pride.png as the style reference.
async function handleGenAsset(req, res) {
  const b = await readJsonBody(req);
  // provider:'freepik' → Mystic (first ref's pride.png becomes the STYLE reference; Mystic has no identity ref)
  const provider = b.provider ? String(b.provider) : imgPrefProvider();   // no provider given → editor's pick
  if (provider === 'freepik') {
    if (!FREEPIK_KEY) return sendJson(res, 400, { error: 'Set FREEPIK_API_KEY in .env (restart the dev server)' });
    const refs0 = Array.isArray(b.refs) ? b.refs : (b.ref ? [b.ref] : []);
    const styleRef = refs0.map(r => 'worlds/pride-and-prejudice/characters/' + String(r || '').trim() + '/appearances/pride.png').find(p => worldsAbs(p)) || null;
    req._json = Object.assign({}, b, { styleRef: b.styleRef || styleRef, model: b.model || process.env.FREEPIK_MYSTIC_MODEL || 'realism', resolution: b.resolution || process.env.FREEPIK_RESOLUTION || '2k' });
    return handleFreepikGenerate(req, res);
  }
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY in the dev-server environment' });
  const relPath = String(b.relPath || '').trim();
  const prompt  = String(b.prompt || '').trim();
  const size    = String(b.size || '1440x2560');
  // refs = character folders whose appearances/pride.png should guide the render.
  const refs = Array.isArray(b.refs) ? b.refs.map(x => String(x || '').trim()).filter(Boolean)
             : (b.ref ? [String(b.ref).trim()] : []);
  if (!/^worlds\/[a-z0-9_/.-]+\.(png|jpg|jpeg|webp)$/i.test(relPath)) return sendJson(res, 400, { error: 'bad relPath' });
  if (!prompt) return sendJson(res, 400, { error: 'prompt required' });
  const abs = path.join(ROOT, relPath);
  if (!isInsideRoot(abs)) return sendJson(res, 403, { error: 'escapes root' });
  try {
    let j;
    // refPaths = extra reference images by worlds/… path (UI screenshots, style boards…)
    const refPaths = Array.isArray(b.refPaths) ? b.refPaths.map(worldsAbs).filter(Boolean) : [];
    const refAbss = refs
      .map(r => path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters', r, 'appearances', 'pride.png'))
      .filter(p => fs.existsSync(p)).concat(refPaths);
    const model = pickImageModel(b.model);
    if (refAbss.length) j = await openaiImageEdit(prompt, refAbss, size, model, { transparent: !!b.transparent });
    else j = await openaiJson('/v1/images/generations', Object.assign({ model, prompt, size }, b.transparent ? { background: 'transparent', output_format: 'png' } : {}));
    const b64 = j.data && j.data[0] && j.data[0].b64_json;
    if (!b64) return sendJson(res, 502, { error: 'no image returned' });
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, Buffer.from(b64, 'base64'));
    return sendJson(res, 200, { ok: true, path: relPath, model });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// ───────────────────────────────────────────────────────────────
// Freepik / Magnific image generation (key from FREEPIK_API_KEY in .env).
// Freepik's API was rebranded Magnific — same endpoints; we send both header
// names and let FREEPIK_API_BASE pick the host. Async pattern: POST → task_id,
// poll GET /{task-id} until COMPLETED (no webhook: localhost isn't reachable).
// ───────────────────────────────────────────────────────────────
const FREEPIK_KEY  = process.env.FREEPIK_API_KEY || process.env.MAGNIFIC_API_KEY || '';
const FREEPIK_BASE = (process.env.FREEPIK_API_BASE || 'https://api.freepik.com').replace(/\/$/, '');
const FREEPIK_ASPECTS = { square_1_1:1, classic_4_3:4/3, traditional_3_4:3/4, widescreen_16_9:16/9, social_story_9_16:9/16,
  smartphone_horizontal_20_9:20/9, smartphone_vertical_9_20:9/20, standard_3_2:3/2, portrait_2_3:2/3, horizontal_2_1:2, vertical_1_2:0.5, social_5_4:5/4, social_post_4_5:4/5 };
function freepikAspectFor(size) {   // '1440x2560' → nearest enum
  const m = /^(\d+)x(\d+)$/.exec(String(size || '')); if (!m) return 'square_1_1';
  const r = parseInt(m[1], 10) / parseInt(m[2], 10); let best = 'square_1_1', bd = 1e9;
  for (const [k, v] of Object.entries(FREEPIK_ASPECTS)) { const d = Math.abs(Math.log(v / r)); if (d < bd) { bd = d; best = k; } }
  return best;
}
function freepikReq(method, pathname, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(FREEPIK_BASE + pathname);
    const body = payload ? Buffer.from(JSON.stringify(payload)) : null;
    const headers = { 'x-freepik-api-key': FREEPIK_KEY, 'x-magnific-api-key': FREEPIK_KEY, 'Accept': 'application/json' };
    if (body) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = body.length; }
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => {
        let j = null; try { j = JSON.parse(d); } catch (e) {}
        if (r.statusCode >= 400) return reject(new Error((j && (j.message || (j.problem && j.problem.message))) || ('HTTP ' + r.statusCode + ' ' + d.slice(0, 200))));
        if (!j) return reject(new Error('bad response: ' + d.slice(0, 200)));
        resolve(j);
      });
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
function httpsGetBuffer(url, hops) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      if ([301, 302, 303, 307, 308].includes(r.statusCode) && r.headers.location && (hops || 0) < 5) { r.resume(); return resolve(httpsGetBuffer(r.headers.location, (hops || 0) + 1)); }
      if (r.statusCode >= 400) { r.resume(); return reject(new Error('download HTTP ' + r.statusCode)); }
      const chunks = []; r.on('data', c => chunks.push(c)); r.on('end', () => resolve({ buf: Buffer.concat(chunks), type: r.headers['content-type'] || '' }));
    }).on('error', reject);
  });
}
// Run one Mystic task to completion. opts: {prompt, model, aspect, resolution, engine, creative, styleRefAbs, structureRefAbs, adherence, hdr, structureStrength}
async function freepikMystic(opts) {
  const payload = { prompt: opts.prompt, resolution: opts.resolution || '2k', aspect_ratio: opts.aspect || 'square_1_1', filter_nsfw: true };
  if (opts.model && opts.model !== 'default') payload.model = opts.model;
  if (opts.engine) payload.engine = opts.engine;
  if (typeof opts.creative === 'number') payload.creative_detailing = Math.max(0, Math.min(100, opts.creative | 0));
  if (opts.styleRefAbs) { payload.style_reference = fs.readFileSync(opts.styleRefAbs).toString('base64'); if (typeof opts.adherence === 'number') payload.adherence = opts.adherence; if (typeof opts.hdr === 'number') payload.hdr = opts.hdr; }
  if (opts.structureRefAbs) { payload.structure_reference = fs.readFileSync(opts.structureRefAbs).toString('base64'); if (typeof opts.structureStrength === 'number') payload.structure_strength = opts.structureStrength; }
  const start = await freepikReq('POST', '/v1/ai/mystic', payload);
  const id = start && start.data && start.data.task_id; if (!id) throw new Error('no task id');
  const t0 = Date.now();
  while (Date.now() - t0 < 4 * 60 * 1000) {
    await new Promise(r => setTimeout(r, 3000));
    const st = await freepikReq('GET', '/v1/ai/mystic/' + id);
    const d = (st && st.data) || {};
    if (d.status === 'COMPLETED') { const url = d.generated && d.generated[0]; if (!url) throw new Error('completed without image'); return { url, task_id: id }; }
    if (d.status === 'FAILED') throw new Error('Mystic task failed');
  }
  throw new Error('Mystic timeout');
}
// Resolve a worlds/… relative path (image file) to an absolute path or null.
function worldsAbs(rel) {
  rel = String(rel || '').trim(); if (!/^worlds\/[a-z0-9_/.\- ]+\.(png|jpg|jpeg|webp)$/i.test(rel)) return null;
  const abs = path.join(ROOT, rel); return (isInsideRoot(abs) && fs.existsSync(abs)) ? abs : null;
}
// GET /api/freepik/status → { configured }
function handleFreepikStatus(req, res) { return sendJson(res, 200, { configured: !!FREEPIK_KEY, base: FREEPIK_BASE }); }
// POST /api/freepik/generate  { prompt, relPath, size?|aspect?, resolution?, model?, engine?, creative?, styleRef?, structureRef?, adherence?, hdr?, structureStrength? }
//   Generates with Mystic, downloads the result and writes it to relPath (under worlds/).
async function handleFreepikGenerate(req, res) {
  if (!FREEPIK_KEY) return sendJson(res, 400, { error: 'Set FREEPIK_API_KEY in .env (restart the dev server)' });
  const b = req._json || await readJsonBody(req);
  const relPath = String(b.relPath || '').trim(); const prompt = String(b.prompt || '').trim();
  if (!/^worlds\/[a-z0-9_/.-]+\.(png|jpg|jpeg|webp)$/i.test(relPath)) return sendJson(res, 400, { error: 'bad relPath' });
  if (!prompt) return sendJson(res, 400, { error: 'prompt required' });
  const abs = path.join(ROOT, relPath); if (!isInsideRoot(abs)) return sendJson(res, 403, { error: 'escapes root' });
  try {
    const out = await freepikMystic({
      prompt, model: b.model, engine: b.engine, creative: (b.creative == null ? undefined : +b.creative),
      aspect: b.aspect || freepikAspectFor(b.size), resolution: b.resolution || '2k',
      styleRefAbs: worldsAbs(b.styleRef), structureRefAbs: worldsAbs(b.structureRef),
      adherence: (b.adherence == null ? undefined : +b.adherence), hdr: (b.hdr == null ? undefined : +b.hdr), structureStrength: (b.structureStrength == null ? undefined : +b.structureStrength) });
    const img = await httpsGetBuffer(out.url);
    fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, img.buf);
    return sendJson(res, 200, { ok: true, path: relPath, task_id: out.task_id, contentType: img.type, bytes: img.buf.length });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// ───────────────────────────────────────────────────────────────
// Higgsfield (images + video) — key from .env: HF_API_KEY (single value; "id:secret" if the console
// gives a pair) or HF_API_KEY_ID + HF_API_KEY_SECRET. Async: POST model path → request_id → poll status.
// ───────────────────────────────────────────────────────────────
const HF_AUTH = (() => { const one = String(process.env.HF_API_KEY || '').trim(); const id = String(process.env.HF_API_KEY_ID || '').trim(), sec = String(process.env.HF_API_KEY_SECRET || '').trim();
  if (id && sec) return id + ':' + sec; return one; })();
function hfReq(method, urlStr, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr); const body = payload ? Buffer.from(JSON.stringify(payload)) : null;
    const headers = { 'Authorization': 'Key ' + HF_AUTH, 'Accept': 'application/json' };
    if (body) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = body.length; }
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch (e) {}
        if (r.statusCode >= 400) return reject(new Error((j && (j.detail || j.message || j.error)) ? JSON.stringify(j.detail || j.message || j.error).slice(0, 300) : ('HTTP ' + r.statusCode + ' ' + d.slice(0, 200))));
        if (!j) return reject(new Error('bad response: ' + d.slice(0, 200))); resolve(j); }); });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
// GET /api/higgsfield/status → { configured }
function handleHfStatus(req, res) { return sendJson(res, 200, { configured: !!HF_AUTH }); }
// POST /api/higgsfield/generate { model:"higgsfield-ai/soul/v2/standard", body:{prompt,…}, relPath:"worlds/…/x.mp4|png" }
//   Submits, polls until completed (max 10 min), downloads the first images[]/videos[]/video url to relPath.
async function handleHfGenerate(req, res) {
  if (!HF_AUTH) return sendJson(res, 400, { error: 'Set HF_API_KEY in .env (restart the dev server)' });
  const b = await readJsonBody(req);
  const model = String(b.model || '').trim().replace(/^\/+/, ''); const relPath = String(b.relPath || '').trim();
  if (!/^[a-z0-9][a-z0-9_\-\/.]*$/i.test(model)) return sendJson(res, 400, { error: 'bad model path' });
  if (!/^worlds\/[a-z0-9_/.-]+\.(png|jpg|jpeg|webp|mp4|webm|mov)$/i.test(relPath)) return sendJson(res, 400, { error: 'bad relPath' });
  const abs = path.join(ROOT, relPath); if (!isInsideRoot(abs)) return sendJson(res, 403, { error: 'escapes root' });
  const payload = (b.body && typeof b.body === 'object') ? b.body : { prompt: String(b.prompt || '') };
  try {
    const start = await hfReq('POST', 'https://api.higgsfield.ai/' + model, payload);
    const statusUrl = start.status_url || ('https://api.higgsfield.ai/requests/' + start.request_id + '/status');
    const t0 = Date.now(); let st = start;
    while (!['completed', 'failed', 'nsfw', 'canceled'].includes(st.status)) {
      if (Date.now() - t0 > 10 * 60 * 1000) return sendJson(res, 504, { error: 'timeout', request_id: start.request_id });
      await new Promise(r => setTimeout(r, 4000)); st = await hfReq('GET', statusUrl);
    }
    if (st.status !== 'completed') return sendJson(res, 502, { error: 'status ' + st.status, request_id: start.request_id, detail: st });
    const url = (st.images && st.images[0] && st.images[0].url) || (st.videos && st.videos[0] && st.videos[0].url) || (st.video && st.video.url) || st.url;
    if (!url) return sendJson(res, 502, { error: 'no output url', detail: st });
    const out = await httpsGetBuffer(url);
    fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, out.buf);
    return sendJson(res, 200, { ok: true, path: relPath, request_id: start.request_id, contentType: out.type, bytes: out.buf.length });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// ---- episode-location manifest (which map spots are episode slots, taken/free) ----
const EPLOC_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'episode-locations.json');
function readEpLocs() { try { return JSON.parse(fs.readFileSync(EPLOC_PATH, 'utf8')); } catch (e) { return { locations: [] }; } }
function writeEpLocs(o) { fs.writeFileSync(EPLOC_PATH, JSON.stringify(o, null, 2)); }

function handleEpLocs(req, res) { return sendJson(res, 200, readEpLocs()); }

// map-locations.json is the SINGLE SOURCE OF TRUTH. episode-locations.json is
// regenerated from it (episode tier only) so the game + map builder, which read
// that file, always reflect the master. requires === unlockedBy.
function mirrorEpLoc() {
  const m = readMapLocs();
  const eps = (m.locations || []).filter(l => l.type === 'episode').map(l => (
    { id: l.id, title: l.title || l.id, x: l.x, y: l.y, episode: l.episode || null,
      order: (typeof l.order === 'number' ? l.order : null), requires: l.unlockedBy || null }));
  writeEpLocs({ locations: eps });
}

// POST /api/author/location-upsert — create or update ONE map location (Map Tracer).
//   { id, title?, type?('episode'|'interactive'), desc?, kind?, icon?, x?, y?, tier?, passesTime?, lifespan?, suitor? }
//   Only the fields present in the body are touched; x/y is the SINGLE source of the
//   pin position (map-roads.json locOverrides is retired). New ids get an order slot
//   and a locations/<id>/explore folder.
const LOC_TYPES = ['episode', 'interactive'];
const PIN_ICONS = ['cafe', 'library', 'store', 'mug', 'flask', 'house'];
const VISIT_TIERS = ['low', 'mid', 'high', 'empty'];
async function handleLocationUpsert(req, res) {
  const b = await readJsonBody(req);
  const id = String(b.id || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return sendJson(res, 400, { error: 'id must be slug-safe (a-z, 0-9, -)' });
  const m = readMapLocs(); m.locations = m.locations || [];
  let loc = m.locations.find(l => l.id === id); const created = !loc;
  if (created) {
    if (!LOC_TYPES.includes(b.type)) return sendJson(res, 400, { error: 'type must be episode or interactive' });
    const maxOrder = Math.max(0, ...m.locations.filter(l => typeof l.order === 'number').map(l => l.order));
    loc = { id, title: id, type: b.type, x: 50, y: 50, unlockedBy: null, appearsAfter: null, order: maxOrder + 1 };
    if (b.type === 'episode') { loc.episode = null; loc.passesTime = true; loc.lifespan = 4; }
    m.locations.push(loc);
  }
  if ('title' in b) loc.title = String(b.title || '').trim() || loc.title || id;
  if ('type' in b && LOC_TYPES.includes(b.type)) loc.type = b.type;
  if ('desc' in b) loc.desc = String(b.desc || '').trim() || undefined;
  if ('kind' in b) loc.kind = String(b.kind || '').trim() || undefined;          // POI sheet sub-title e.g. "Coffee House · Day"
  if ('icon' in b) loc.icon = PIN_ICONS.includes(b.icon) ? b.icon : undefined;   // interactive pin glyph
  if ('suitor' in b) loc.suitor = String(b.suitor || '').trim() || undefined;
  if ('home' in b) loc.home = String(b.home || '').trim() || undefined;               // suitor home: owner id — opens with the suitor, owner idles here
  if ('visit' in b) { const v = (b.visit && typeof b.visit === 'object') ? b.visit : {}; const out = {};
    VISIT_TIERS.forEach(t => { const txt = String(v[t] || '').trim(); if (txt) out[t] = txt; });
    loc.visit = Object.keys(out).length ? out : undefined; }                           // visit narration by relationship tier (low/mid/high) + empty
  // Consequence when this EPISODE is missed (declined for a sibling / slot passed): {who, bg, script}
  // → plays in the whisper UI on the turn change that seals the miss (prideEndFlow).
  if ('missed' in b) { const m = (b.missed && typeof b.missed === 'object') ? b.missed : null;
    const out = m ? { who:String(m.who||'').trim(), bg:String(m.bg||'').trim(), script:String(m.script||'').trim() } : null;
    loc.missed = (out && out.script) ? out : undefined; }
  // Optional cover image for Map Events (polaroid) — relative to worlds/pride-and-prejudice/
  if ('cover' in b) loc.cover = String(b.cover || '').trim() || undefined;
  const x = Number(b.x), y = Number(b.y);
  if ('x' in b && isFinite(x)) loc.x = Math.round(Math.max(0, Math.min(100, x)) * 10) / 10;
  if ('y' in b && isFinite(y)) loc.y = Math.round(Math.max(0, Math.min(100, y)) * 10) / 10;
  if ('tier' in b) { const t = parseInt(b.tier, 10); loc.tier = (isFinite(t) && t >= 1) ? t : undefined; }
  if ('passesTime' in b) loc.passesTime = (b.passesTime === false) ? false : true;
  if ('lifespan' in b) { const n = parseInt(b.lifespan, 10); loc.lifespan = (isFinite(n) && n >= 0) ? n : 4; }
  if (loc.route) delete loc.route;   // legacy approach route — walkers use map-roads.json now
  Object.keys(loc).forEach(k => { if (loc[k] === undefined) delete loc[k]; });
  writeMapLocs(m); mirrorEpLoc();
  if (created) fs.mkdirSync(path.join(ROOT, 'worlds', 'pride-and-prejudice', 'locations', id, 'explore'), { recursive: true });
  return sendJson(res, 200, { ok: true, created, location: loc });
}

// POST /api/author/location-delete { id } — removes the location record, its
//   road attachments (loc:<id> edges) and any fog-layer binding. Folders + scripts
//   on disk are left untouched.
async function handleLocationDelete(req, res) {
  const b = await readJsonBody(req);
  const id = String(b.id || '').trim();
  const m = readMapLocs();
  const before = (m.locations || []).length;
  m.locations = (m.locations || []).filter(l => l.id !== id);
  if (m.locations.length === before) return sendJson(res, 404, { error: 'no such location' });
  m.locations.forEach(l => { if (l.unlockedBy === id) l.unlockedBy = null; if (l.appearsAfter === id) l.appearsAfter = null;
    if (Array.isArray(l.unlocks)) l.unlocks = l.unlocks.filter(u => (u && u.id) !== id); });
  writeMapLocs(m); mirrorEpLoc();
  try { const r = JSON.parse(fs.readFileSync(ROADS_PATH, 'utf8')); const k = 'loc:' + id;
    if (r.roads && Array.isArray(r.roads.edges)) r.roads.edges = r.roads.edges.filter(e => e[0] !== k && e[1] !== k);
    if (r.locOverrides) delete r.locOverrides[id];
    fs.writeFileSync(ROADS_PATH, JSON.stringify(r, null, 2)); } catch (e) {}
  try { const f = JSON.parse(fs.readFileSync(FOG_PATH, 'utf8')); let ch = false;
    (f.fogs || []).forEach(g => { if (g.locId === id) { g.locId = null; ch = true; } });
    if (ch) fs.writeFileSync(FOG_PATH, JSON.stringify(f)); } catch (e) {}
  return sendJson(res, 200, { ok: true });
}

// POST /api/author/suggest-locations { brief, existing:[] } → AI suggests new spots
async function handleSuggestLocations(req, res) {
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY' });
  const b = await readJsonBody(req);
  const brief = String(b.brief || '').trim();
  const existing = Array.isArray(b.existing) ? b.existing.join(', ') : '';
  const sys = 'You suggest Regency (Pride & Prejudice) map locations for episodes. Return ONLY a JSON array of 5 objects: [{"id":"kebab-case","title":"Nice Name","note":"6-10 word vibe"}]. No prose.';
  const user = `Existing locations: ${existing || '(none)'}\nEpisode brief: ${brief || '(general)'}\nSuggest 5 fresh, period-fitting locations not already listed.`;
  try {
    const j = await openaiJson('/v1/chat/completions', { model: CHAT_MODEL, temperature: 0.9, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
    let txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '[]';
    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    let arr = []; try { arr = JSON.parse(txt); } catch (e) {}
    return sendJson(res, 200, { ok: true, suggestions: Array.isArray(arr) ? arr : [] });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// POST /api/author/add-placeholder { title }  → a fast-forward placeholder episode
//   (no script; completing it just advances unlocks). Appended to the master.
async function handleAddPlaceholder(req, res) {
  const b = await readJsonBody(req);
  const title = String(b.title || 'Placeholder').trim();
  let id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'placeholder';
  const m = readMapLocs();
  if ((m.locations || []).some(l => l.id === id)) { let n = 2; while ((m.locations || []).some(l => l.id === id + '-' + n)) n++; id = id + '-' + n; }
  const maxOrder = Math.max(0, ...(m.locations || []).filter(l => l.type === 'episode' && typeof l.order === 'number').map(l => l.order));
  m.locations.push({ id, title, type: 'episode', x: 50, y: 50, unlockedBy: null, episode: null, mode: 'placeholder', order: maxOrder + 1 });
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res, 200, { ok: true, id, title });
}

// POST /api/author/archive-location { id, archived }  → archive (or restore) an
//   episode's CONTENT only. The LOCATION stays — same map pin, same manager row,
//   `episode` field untouched. Only the episode's asset+script folder
//   (episodes/<episode>/) is moved under `_archive/` so old generated assets never
//   collide with newly generated ones, and an `episodeArchived` marker is set for
//   the manager's badge. Fully reversible.
async function handleArchiveLocation(req, res) {
  const b = await readJsonBody(req);
  const id = String(b.id || '').trim();
  const archived = !!b.archived;
  const m = readMapLocs();
  const loc = (m.locations || []).find(l => l.id === id);
  if (!loc) return sendJson(res, 404, { error: 'location not found' });
  const WROOT = path.join(ROOT, 'worlds', 'pride-and-prejudice');
  const ARCH = path.join(WROOT, '_archive');
  const moved = [];
  try {
    if (loc.episode) {
      const rel = path.join('episodes', loc.episode);
      const live = path.join(WROOT, rel);
      const dead = path.join(ARCH, rel);
      const src = archived ? live : dead;
      const dst = archived ? dead : live;
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.renameSync(src, dst);
        moved.push(rel);
      }
    }
  } catch (e) { return sendJson(res, 500, { error: String(e.message || e) }); }
  if (archived) loc.episodeArchived = true; else delete loc.episodeArchived;
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res, 200, { ok: true, id, archived, moved });
}

async function handleAssignEpisode(req, res) {
  const b = await readJsonBody(req);
  const id = String(b.id || '').trim(), episode = String(b.episode || '').trim();
  const m = readMapLocs(); const loc = (m.locations || []).find(l => l.id === id);
  if (!loc) return sendJson(res, 404, { error: 'location not found' });
  loc.episode = episode || null; if (!loc.type) loc.type = 'episode';
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res, 200, { ok: true });
}

// GET /api/author/episodes  → the episode-bearing locations, enriched with order,
//   unlock prerequisite, asset-completeness status, and a thumbnail. Same JSON the
//   map reads, so the manager and the map stay in sync.
function handleEpisodesList(req, res) {
  const WROOT = path.join(ROOT, 'worlds', 'pride-and-prejudice');
  const m = readEpLocs();
  const eps = (m.locations || []).filter(l => l.episode);
  const out = eps.map(l => {
    const epRel = String(l.episode).startsWith('episodes/') ? l.episode : path.join('episodes', l.episode);
    const epDir = path.join(WROOT, epRel);
    const scriptPath = path.join(epDir, 'scripts', 'main.txt');
    let hasScript = fs.existsSync(scriptPath), total = 0, ready = 0, thumb = '';
    if (hasScript) {
      let txt = ''; try { txt = fs.readFileSync(scriptPath, 'utf8'); } catch (e) {}
      const bgs = [...txt.matchAll(/\[bg:explore=([^\]\s]+)\]/g)].map(x => x[1]);
      const cuts = [...txt.matchAll(/\[bg:cutscene=([^\]\s]+)\]/g)].map(x => x[1]);
      for (const f of new Set(bgs)) { total++; const p = path.join(WROOT, 'locations', l.id, 'explore', f); if (fs.existsSync(p)) { ready++; if (!thumb) thumb = `worlds/pride-and-prejudice/locations/${l.id}/explore/${f}`; } }
      for (const f of new Set(cuts)) { total++; if (fs.existsSync(path.join(epDir, 'cutscenes', f))) ready++; }
    }
    const status = !hasScript ? 'empty' : (total > 0 && ready >= total ? 'ready' : 'draft');
    return { id: l.id, title: l.title || l.id, x: l.x, y: l.y, episode: l.episode,
      order: (typeof l.order === 'number' ? l.order : null), requires: l.requires || null,
      hasScript, assetsTotal: total, assetsReady: ready, status, thumb };
  });
  // stable order: explicit order first, then by title
  out.forEach((e, i) => { if (e.order === null) e.order = 1000 + i; });
  out.sort((a, b) => a.order - b.order);
  out.forEach((e, i) => e.order = i + 1);  // normalize to 1..n for display
  return sendJson(res, 200, { episodes: out });
}

// POST /api/author/episodes-save  { episodes:[{id, order, requires}] }
//   persists ordering + unlock prerequisites back into episode-locations.json
async function handleEpisodesSave(req, res) {
  const b = await readJsonBody(req);
  const list = Array.isArray(b.episodes) ? b.episodes : [];
  const m = readEpLocs();
  list.forEach(e => { const loc = m.locations.find(l => l.id === e.id); if (!loc) return;
    if (typeof e.order === 'number') loc.order = e.order;
    loc.requires = e.requires || null; });
  writeEpLocs(m);
  return sendJson(res, 200, { ok: true });
}

// GET /api/author/suitors → canonical suitors + their discovery pools, read from
//   each characters/<id>/character.json. Powers the editor's Discovery code picker.
const SUITOR_IDS = ['mr_darcy','mr_bingley','mr_wickham','mr_collins','lord_ravenscar','sir_ashbourne','capt_vane','mr_devereux','mr_hale','mr_fenwick','ens_pryce','mr_quill'];
function handleSuitorsList(req, res) {
  const cdir = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters');
  const out = SUITOR_IDS.map(id => {
    let name = id, discoveries = [];
    try { const d = JSON.parse(fs.readFileSync(path.join(cdir, id, 'character.json'), 'utf8'));
      name = d.name || id; discoveries = Array.isArray(d.discoveries) ? d.discoveries : []; } catch (e) {}
    return { id, name, discoveries };
  });
  return sendJson(res, 200, { suitors: out });
}

// GET /api/author/story-map → the whole episode flow graph for the editor's Story view:
//   nodes (episode-tier map locations), static unlock edges (unlockedBy), and fork
//   groups scanned from each episode's (Unlock:) directives.
function scanUnlocksServer(txt){
  const out=[]; const re=/\(\s*Unlock\s*:\s*([^)]*)\)/gi; let m;
  while((m=re.exec(txt||''))){ const parts=m[1].split('|').map(s=>s.trim()).filter(Boolean); if(!parts.length) continue;
    const u={id:parts[0], group:'', kind:'main', timer:'', title:'', desc:'', cover:''};
    for(let i=1;i<parts.length;i++){ const p=parts[i]; const kv=p.match(/^(\w+)\s*=\s*([\s\S]+)$/);
      if(kv && ['group','kind','timer','title','desc','cover'].includes(kv[1].toLowerCase())) u[kv[1].toLowerCase()]=kv[2].trim();
      else if(/\.(png|jpe?g|webp)$/i.test(p)) u.cover=p; else if(!u.title) u.title=p; else if(!u.desc) u.desc=p; }
    out.push(u); }
  return out;
}
// Set of ids that have a real game-map pin (static hotspot in dialog2.html).
// NOTE: an "X-zoom" hotspot (e.g. meryton-zoom = the Short Stories point) is a
// DIFFERENT location than "X" — it does NOT count as a pin for "X".
let _staticPoiCache=null;
function staticPoiSet(){
  if(_staticPoiCache) return _staticPoiCache;
  const s=new Set();
  try{ const html=fs.readFileSync(path.join(ROOT,'dialog2.html'),'utf8');
    const re=/data-poi="([a-z0-9\-]+)"/gi; let m; while((m=re.exec(html))){ s.add(m[1]); } }catch(e){}
  _staticPoiCache=s; return s;
}
function scriptExistsFor(l){
  if(!l || !l.episode) return false;
  const WROOT=path.join(ROOT,'worlds','pride-and-prejudice');
  const epRel=String(l.episode).startsWith('episodes/')?l.episode:path.join('episodes',l.episode);
  try{ const t=fs.readFileSync(path.join(WROOT,epRel,'scripts','main.txt'),'utf8'); return !!(t&&t.trim()); }catch(e){ return false; }
}
function handleStoryMap(req,res){
  const WROOT=path.join(ROOT,'worlds','pride-and-prejudice');
  const poi=staticPoiSet();
  let locs=(readMapLocs().locations||[]).filter(l=>['episode','interactive','short-story'].includes(l.type));
  // Rule A — hide pinless phantom episodes from the story map: an episode with
  // no script AND no own game-map pin (e.g. "meryton", which only collides with
  // the Short Stories "meryton-zoom" point) is not shown.
  // Interactive / short-story nodes always render (rails / coord pins).
  locs=locs.filter(l=>{
    if(l.type!=='episode') return true;
    return scriptExistsFor(l) || poi.has(l.id);
  });
  const nodes=locs.map(l=>{
    // Rule B — no script → auto "placeholder".
    const hasScript = l.type==='episode' ? scriptExistsFor(l) : true;
    const mode = (l.type==='episode' && !hasScript) ? 'placeholder' : (l.mode||'');
    return {id:l.id,title:l.title||l.id,type:l.type,x:l.x,y:l.y,sx:(typeof l.sx==='number'?l.sx:null),sy:(typeof l.sy==='number'?l.sy:null),tier:(typeof l.tier==='number'?l.tier:null),order:(typeof l.order==='number'?l.order:null),mode:mode,hasScript:hasScript,suitor:l.suitor||null,episode:l.episode||null,unlockedBy:l.unlockedBy||null,appearsAfter:l.appearsAfter||null,time:(l.time||'any'),passesTime:(l.passesTime!==false),lifespan:(typeof l.lifespan==='number'?l.lifespan:4),archived:!!l.archived};
  });
  const visible=new Set(nodes.map(n=>n.id));
  const staticEdges=[]; locs.forEach(l=>{ const src=l.unlockedBy||l.appearsAfter; if(src && visible.has(src) && visible.has(l.id)) staticEdges.push({from:src,to:l.id}); });   // gate = unlockedBy or appearsAfter
  const forks=[];
  locs.forEach(l=>{
    // Source edges come from the script (Unlock:) if it exists, otherwise from
    // json-stored `unlocks` (placeholder nodes authored on the story map).
    let unlocks=[];
    if(scriptExistsFor(l)){
      const epRel=String(l.episode).startsWith('episodes/')?l.episode:path.join('episodes',l.episode);
      let txt=''; try{ txt=fs.readFileSync(path.join(WROOT,epRel,'scripts','main.txt'),'utf8'); }catch(e){ txt=''; }
      unlocks=scanUnlocksServer(txt);
    } else if(Array.isArray(l.unlocks)){
      unlocks=l.unlocks;
    }
    if(!unlocks.length) return;
    const groups={};
    unlocks.forEach(u=>{ if(!visible.has(u.id) && !String(u.id||'').startsWith('ui:')) return;   // drop edges to hidden phantom nodes (e.g. meryton); keep UI-pack targets (ui:*)
      const key=u.group||('__solo_'+u.id); const g=(groups[key]=groups[key]||{group:u.group||'',kind:u.kind||'main',timer:u.timer||'',members:[]});
      g.members.push({id:u.id,title:u.title||'',desc:u.desc||'',cover:u.cover||''}); if(u.kind)g.kind=u.kind; if(u.timer)g.timer=u.timer; });
    Object.keys(groups).forEach(k=>{ if(!groups[k].members.length) return; forks.push(Object.assign({source:l.id, grouped:!!groups[k].group}, groups[k])); });
  });
  return sendJson(res,200,{nodes,staticEdges,forks});
}

// POST /api/author/save-unlocks { episode, unlocks:[{id,group,kind,timer,title,desc,cover}] }
//   Rewrites the (Unlock:) block in that episode's main.txt (strips old, appends fresh).
function unlockLineServer(u){ let s='(Unlock: '+(u.id||''); if(u.group)s+=' | group='+u.group; if(u.kind==='side')s+=' | kind=side'; if(u.kind==='side'&&u.timer)s+=' | timer='+u.timer; if(u.title)s+=' | title='+u.title; if(u.desc)s+=' | desc='+u.desc; if(u.cover)s+=' | cover='+u.cover; return s+')'; }
async function handleSaveUnlocks(req,res){
  const b=await readJsonBody(req);
  const valid=(Array.isArray(b.unlocks)?b.unlocks:[]).filter(u=>u&&u.id);
  const epRaw=String(b.episode||'').trim();
  const srcId=String(b.id||'').trim();
  // Does the source have a real script file? If so, the (Unlock:) block lives
  // in the script (in-game forks). If NOT (a placeholder node), we store the
  // branch edges in map-locations.json so the flow is still authorable.
  let sp=null;
  if(epRaw){ const epRel=epRaw.startsWith('episodes/')?epRaw:path.join('episodes',epRaw);
    const p=path.join(ROOT,'worlds','pride-and-prejudice',epRel,'scripts','main.txt');
    if(fs.existsSync(p)) sp=p; }
  if(sp){
    let txt=''; try{ txt=fs.readFileSync(sp,'utf8'); }catch(e){ txt=''; }
    let lines=txt.split('\n').filter(ln=> !/^\s*\(\s*Unlock\s*:/i.test(ln) && !/^\s*#\s*Fork —/i.test(ln));
    while(lines.length && !lines[lines.length-1].trim()) lines.pop();
    if(valid.length){ lines.push(''); lines.push('# Fork — bölüm bitince açılacaklar'); valid.forEach(u=>lines.push(unlockLineServer(u))); }
    try{ fs.writeFileSync(sp,lines.join('\n')+'\n'); }catch(e){ return sendJson(res,500,{error:'write failed'}); }
    // also clear any stale json-stored edges for this id (script is authority)
    if(srcId){ const m=readMapLocs(); const loc=(m.locations||[]).find(l=>l.id===srcId); if(loc && loc.unlocks){ delete loc.unlocks; writeMapLocs(m); mirrorEpLoc(); } }
    return sendJson(res,200,{ok:true, count:valid.length, store:'script'});
  }
  // placeholder / script-less source → store edges in map-locations.json
  if(!srcId) return sendJson(res,400,{error:'id or scripted episode required'});
  const m=readMapLocs(); const loc=(m.locations||[]).find(l=>l.id===srcId);
  if(!loc) return sendJson(res,404,{error:'location not found: '+srcId});
  if(valid.length) loc.unlocks=valid.map(u=>({id:u.id,group:u.group||'',kind:u.kind||'main',timer:u.timer||'',title:u.title||'',desc:u.desc||'',cover:u.cover||''}));
  else delete loc.unlocks;
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res,200,{ok:true, count:valid.length, store:'map-locations'});
}

// POST /api/author/save-story-pos { id, sx, sy }  → store story-map layout coords (0..100)
//   on the map-location WITHOUT touching the game map x/y.
async function handleSaveStoryPos(req,res){
  const b=await readJsonBody(req); const id=String(b.id||'').trim(); if(!id) return sendJson(res,400,{error:'id required'});
  const m=readMapLocs(); const loc=(m.locations||[]).find(l=>l.id===id); if(!loc) return sendJson(res,404,{error:'not found'});
  if(typeof b.sx==='number') loc.sx=Math.max(0,Math.min(100,b.sx));   // sx = width %
  if(typeof b.tier==='number') loc.tier=Math.max(1,Math.round(b.tier));   // story TUR (sıralı kilit) — manager 'order'dan bağımsız
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res,200,{ok:true});
}

// POST /api/author/clear-unlock { to }  → clears unlockedBy on that location (deletes a static unlock edge)
async function handleClearUnlock(req,res){
  const b=await readJsonBody(req); const to=String(b.to||'').trim(); if(!to) return sendJson(res,400,{error:'to required'});
  const m=readMapLocs(); const loc=(m.locations||[]).find(l=>l.id===to); if(!loc) return sendJson(res,404,{error:'not found'});
  loc.unlockedBy=null; loc.appearsAfter=null; writeMapLocs(m); mirrorEpLoc();   // free the node: appears + playable from start
  return sendJson(res,200,{ok:true});
}

// ---- Full map-location manifest (all 4 tiers: episode / interactive / short-story / onboarding) ----
// ---- Whispers (onboarding-style sequences that auto-play after an episode) ----
// worlds/pride-and-prejudice/whispers.json { whispers:[ {id, after:<episode pin id>, who, focus?, priority?, title?, script} ] }
const WHISPER_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'whispers.json');
function handleWhispers(req, res){ let j={whispers:[]}; try{ j=JSON.parse(fs.readFileSync(WHISPER_PATH,'utf8')); }catch(e){} return sendJson(res, 200, j); }
async function handleSaveWhispers(req, res){ const b=await readJsonBody(req); const arr=Array.isArray(b.whispers)?b.whispers:[];
  const note='Whisper = episode bitince (after=pin id) kendiliğinden açılan kısa diyalog (mode pc, encounter UI). who=konuşan NPC, focus=bitince kamera+pin nabzı, script=episode DSL. Tek sefer, tur başına 1. Editör: Story map → düğüm → "Onboarding · whisper".';
  try{ fs.writeFileSync(WHISPER_PATH, JSON.stringify({ _note:note, whispers:arr }, null, 2)+'\n'); }catch(e){ return sendJson(res,500,{error:'write failed'}); }
  return sendJson(res, 200, { ok:true, count:arr.length }); }

// ---- Encounters (defined 2-character map encounters) ----
const ENC_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'encounters.json');
function handleEncounters(req, res){ let j={encounters:[]}; try{ j=JSON.parse(fs.readFileSync(ENC_PATH,'utf8')); }catch(e){} return sendJson(res, 200, j); }
async function handleSaveEncounters(req, res){ const b=await readJsonBody(req); const arr=Array.isArray(b.encounters)?b.encounters:[];
  let note=''; try{ note=(JSON.parse(fs.readFileSync(ENC_PATH,'utf8'))._note)||''; }catch(e){}
  try{ fs.writeFileSync(ENC_PATH, JSON.stringify({ _note:note, encounters:arr }, null, 2)+'\n'); }catch(e){ return sendJson(res,500,{error:'write failed'}); }
  return sendJson(res, 200, { ok:true, count:arr.length }); }

// ---- Fog masks (painted foggy regions over the map) ----
// v2 shape: { version:2, w, h, fogs:[{id,name,locId,mask}] } — multiple fog layers,
// each optionally tied to a location (locId) so the game lifts it once that location
// unlocks. Legacy shape { mask, w, h } is still read (treated as one fog, no locId).
const FOG_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'map-fog.json');
function handleFog(req, res){ let j={version:2,fogs:[]}; try{ j=JSON.parse(fs.readFileSync(FOG_PATH,'utf8')); }catch(e){} return sendJson(res, 200, j); }
async function handleSaveFog(req, res){ const b=await readJsonBody(req);
  let o;
  if (Array.isArray(b.fogs)) {
    const fogs = b.fogs
      .filter(f => f && typeof f.mask==='string')
      .map((f,i) => ({ id:(f.id||('fog'+(i+1))), name:(f.name||('Sis '+(i+1))), locId:(f.locId||null), mask:f.mask }));
    o = { version:2, w:+b.w||0, h:+b.h||0, fogs, updated:new Date().toISOString() };
  } else {
    // legacy single-mask post
    o = { version:2, w:+b.w||0, h:+b.h||0,
      fogs: (typeof b.mask==='string' && b.mask) ? [{id:'fog1',name:'Sis 1',locId:null,mask:b.mask}] : [],
      updated:new Date().toISOString() };
  }
  try{ fs.writeFileSync(FOG_PATH, JSON.stringify(o)); }catch(e){ return sendJson(res,500,{error:'write failed'}); }
  return sendJson(res, 200, { ok:true, count:o.fogs.length, bytes:o.fogs.reduce((s,f)=>s+(f.mask||'').length,0) }); }

// ---- Road network (map-tracer graph): persisted so edits survive + are shareable ----
const ROADS_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'map-roads.json');
function handleRoads(req, res){ let j=null; try{ j=JSON.parse(fs.readFileSync(ROADS_PATH,'utf8')); }catch(e){} return sendJson(res, 200, j||{roads:{nodes:[],edges:[]},regions:[]}); }
async function handleSaveRoads(req, res){ const b=await readJsonBody(req);
  const roads = (b.roads && Array.isArray(b.roads.nodes) && Array.isArray(b.roads.edges)) ? b.roads : {nodes:[],edges:[]};
  const o = {
    _note: "Yürüme yol ağı (graph) — map-tracer.html ile çizildi. nodes:[{id,x,y}] yol joint'leri (yüzde koordinat), edges:[[a,b]] bağlantılar. 'loc:<id>' kenarları o lokasyon pin'ine attach demektir. regions = renkli bölgeler. Lokasyon konumları map-locations.json'da (tek kaynak).",
    roads,
    regions: Array.isArray(b.regions) ? b.regions : [],
    updated: new Date().toISOString()
  };
  try{ fs.writeFileSync(ROADS_PATH, JSON.stringify(o, null, 2)); }catch(e){ return sendJson(res,500,{error:'write failed'}); }
  return sendJson(res, 200, { ok:true, nodes:o.roads.nodes.length, edges:o.roads.edges.length, regions:o.regions.length }); }

const MAPLOC_PATH = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'map-locations.json');
function readMapLocs() { try { return JSON.parse(fs.readFileSync(MAPLOC_PATH, 'utf8')); } catch (e) { return { locations: [] }; } }
function writeMapLocs(o) { fs.writeFileSync(MAPLOC_PATH, JSON.stringify(o, null, 2)); }

// GET /api/author/map-locations → every map location across all 4 tiers, with
//   unlock rule; episode tier also carries asset-completeness status.
function handleMapLocations(req, res) {
  const WROOT = path.join(ROOT, 'worlds', 'pride-and-prejudice');
  const eploc = readMapLocs();
  const epById = {}; (readEpLocs().locations || []).forEach(l => { epById[l.id] = l; });
  const out = (eploc.locations || []).filter(l => l && l.id).map(l => {
    let status = null;
    if (l.type === 'episode') {
      const ep = epById[l.id] && epById[l.id].episode;
      if (!ep) status = 'planned';                 // episode tier but no script assigned yet
      else {
        const epRel = String(ep).startsWith('episodes/') ? ep : path.join('episodes', ep);
        const epDir = path.join(WROOT, epRel);
        const scriptPath = path.join(epDir, 'scripts', 'main.txt');
        if (!fs.existsSync(scriptPath)) status = 'planned';
        else {
          let txt = ''; try { txt = fs.readFileSync(scriptPath, 'utf8'); } catch (e) {}
          let total = 0, ready = 0;
          const bgs = [...txt.matchAll(/\[bg:explore=([^\]\s]+)\]/g)].map(x => x[1]);
          const cuts = [...txt.matchAll(/\[bg:cutscene=([^\]\s]+)\]/g)].map(x => x[1]);
          for (const f of new Set(bgs)) { total++; if (fs.existsSync(path.join(WROOT, 'locations', l.id, 'explore', f))) ready++; }
          for (const f of new Set(cuts)) { total++; if (fs.existsSync(path.join(epDir, 'cutscenes', f))) ready++; }
          status = (total > 0 && ready >= total) ? 'ready' : 'draft';
          l = Object.assign({}, l, { assetsTotal: total, assetsReady: ready });
        }
      }
    }
    return Object.assign({ status }, l);
  });
  return sendJson(res, 200, { locations: out });
}

// POST /api/author/map-locations-save { locations:[{id, unlockedBy, order}] }
async function handleMapLocationsSave(req, res) {
  const b = await readJsonBody(req);
  const list = Array.isArray(b.locations) ? b.locations : [];
  const m = readMapLocs();
  list.forEach(e => { const loc = (m.locations || []).find(l => l.id === e.id); if (!loc) return;
    if ('unlockedBy' in e) loc.unlockedBy = e.unlockedBy || null;
    if ('appearsAfter' in e) loc.appearsAfter = e.appearsAfter || null;
    if ('time' in e) { const T=['day','night','dawn','sunset','any']; loc.time = (T.includes(e.time) && e.time!=='any' && e.time!=='day') ? e.time : null; }   // map mood; day/any → default (null)
    if ('passesTime' in e) loc.passesTime = (e.passesTime === false) ? false : true;                  // time model: does this episode consume its slot?
    if ('lifespan' in e) { const n = parseInt(e.lifespan, 10); loc.lifespan = (isFinite(n) && n >= 0) ? n : 4; }   // days a non-time-passing episode stays
    if (typeof e.order === 'number') loc.order = e.order; });
  writeMapLocs(m); mirrorEpLoc();
  return sendJson(res, 200, { ok: true });
}

// POST /api/author/expand-script { script, op, ... } → AI edits the script, returns full updated script.
//   op: 'insert'  { position:'start'|'end'|'after', after, count }  — add N new situations
//       'dialogues' { situationId, n }                              — rewrite one situation to ~N exchanges
//       'add-cutscene' { situationId? }                            — add a dramatic cutscene beat
async function handleExpandScript(req, res) {
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY' });
  const b = await readJsonBody(req);
  const script = String(b.script || '').trim();
  const op = String(b.op || '');
  if (!script) return sendJson(res, 400, { error: 'script required' });
  let instr = '';
  if (op === 'insert') {
    const where = b.position === 'start' ? 'at the VERY BEGINNING' : (b.position === 'end' ? 'at the VERY END' : ('immediately AFTER the situation whose id is "' + (b.after || '') + '"'));
    instr = 'Insert ' + (b.count || 1) + ' brand-new situation(s) ' + where + '. They must extend the story coherently with the surrounding beats, using the same characters, location and DSL format. Give each a fresh snake_case id, a Title, and a one-line description. Keep every EXISTING situation exactly as-is.';
  } else if (op === 'dialogues') {
    instr = 'Rewrite ONLY the situation whose id is "' + (b.situationId || '') + '" so it contains about ' + (b.n || 4) + ' dialogue exchanges — expand or trim its dialogue naturally while keeping its id, title, cast and role. Leave ALL other situations byte-for-byte unchanged.';
  } else if (op === 'add-cutscene') {
    instr = 'Add ONE dramatic cutscene: ' + (b.situationId ? ('augment the situation "' + b.situationId + '"') : 'insert a fitting new situation') + ' with a [bg:cutscene=snake_case.png] full still and 1–2 [ui:bubble] caption lines. Keep everything else unchanged.';
  } else if (op === 'custom') {
    instr = String(b.instruction || '').trim();
    if (!instr) return sendJson(res, 400, { error: 'instruction required' });
  } else return sendJson(res, 400, { error: 'bad op' });
  const sys = DSL_SPEC + '\n\nYou are EDITING an existing script. Apply the instruction and return the FULL updated script (all situations, in order) — ONLY the script text, nothing else.';
  const user = 'EXISTING SCRIPT:\n' + script + '\n\nEDIT INSTRUCTION: ' + instr + '\n\nReturn the complete updated script now.';
  try {
    const j = await openaiJson('/v1/chat/completions', { model: CHAT_MODEL, temperature: 0.8, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
    let out = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    out = normalizeSuitorIds(out.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim());
    if (!out) return sendJson(res, 502, { error: 'empty result' });
    return sendJson(res, 200, { ok: true, script: out });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

async function handleAddCharacter(req, res) {
  const b = await readJsonBody(req);
  const folder = String(b.folder || '').trim();
  if (!/^[a-z0-9][a-z0-9_]*$/i.test(folder)) return sendJson(res, 400, { error: 'folder must be snake_case' });
  const dir = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters', folder, 'appearances');
  if (!isInsideRoot(dir)) return sendJson(res, 403, { error: 'escapes root' });
  fs.mkdirSync(dir, { recursive: true });
  return sendJson(res, 200, { ok: true, folder });
}

// POST /api/author/suggest-characters  → 3 fresh character concepts (for the creator screen)
async function handleSuggestCharacters(req, res) {
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY' });
  const base = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters');
  let existing = [];
  try { existing = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name); } catch (e) {}
  const sys = 'You suggest NEW characters for a Regency-era Pride & Prejudice visual novel. '
    + 'Return ONLY a JSON array of exactly 3 objects: [{"title":"3-5 word archetype","brief":"one vivid sentence describing who they are and their tension with the heroine Arabella"}]. No prose.';
  const user = `Existing characters (do not duplicate): ${existing.join(', ') || '(none)'}\nSuggest 3 fresh, period-fitting characters.`;
  try {
    const j = await openaiJson('/v1/chat/completions', { model: CHAT_MODEL, temperature: 1.0, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
    let txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '[]';
    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    let arr = []; try { arr = JSON.parse(txt); } catch (e) {}
    return sendJson(res, 200, { ok: true, suggestions: Array.isArray(arr) ? arr.slice(0, 3) : [] });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// POST /api/author/generate-character  { brief }
//   AI invents THREE world-appropriate P&P character candidates. Nothing is written to
//   disk here — the UI shows 3 cards; the chosen one is saved via /api/author/commit-character.
async function handleGenerateCharacter(req, res) {
  if (!OPENAI_KEY) return sendJson(res, 400, { error: 'Set OPENAI_API_KEY in the dev-server environment' });
  const b = await readJsonBody(req);
  const brief = String(b.brief || '').trim();
  if (!brief) return sendJson(res, 400, { error: 'brief required' });
  const base = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters');
  let existing = [];
  try { existing = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name); } catch (e) {}
  const sys = `You invent NEW characters for a Regency-era Pride & Prejudice visual novel. `
    + `They must fit the period and world (early-19th-century English gentry: manners, courtship, class, wit). `
    + `Return ONLY a JSON object of the form {"candidates":[ ... 3 objects ... ]}. Each candidate object has keys: `
    + `name (display name, e.g. "Mr. Fitzwilliam Hale"), `
    + `folder (snake_case id from the name, letters/digits/underscore only, unique across candidates and existing folders), `
    + `archetype (2-4 words, e.g. "The Brooding Rival"), `
    + `appearance (one vivid sentence describing looks & dress, for later portrait generation), `
    + `definition (2-3 sentences: background, standing, what they want), `
    + `voice (one sentence on how they speak), `
    + `traits (array of 2-3 short trait words). `
    + `The 3 candidates should be distinct takes on the brief.`;
  const user = `Existing character folders (avoid duplicating): ${existing.join(', ')}\n\nBrief for the new character:\n${brief}\n\nInvent 3 distinct candidates now as JSON.`;
  try {
    const j = await openaiJson('/v1/chat/completions', {
      model: CHAT_MODEL, temperature: 1.0,
      response_format: { type: 'json_object' },
      messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ],
    });
    const raw = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '{}';
    let parsed; try { parsed = JSON.parse(raw); } catch (e) { return sendJson(res, 502, { error: 'AI returned non-JSON' }); }
    let cands = Array.isArray(parsed.candidates) ? parsed.candidates : (Array.isArray(parsed) ? parsed : []);
    const norm = cands.slice(0, 3).map(spec => ({
      name: spec.name || '', folder: String(spec.folder || spec.name || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, ''),
      archetype: spec.archetype || '', appearance: spec.appearance || '', definition: spec.definition || '',
      voice: spec.voice || '', traits: Array.isArray(spec.traits) ? spec.traits : [], brief,
    })).filter(c => c.folder);
    if (!norm.length) return sendJson(res, 502, { error: 'AI gave no usable candidates' });
    return sendJson(res, 200, { ok: true, candidates: norm });
  } catch (e) { return sendJson(res, 502, { error: String(e.message || e) }); }
}

// POST /api/author/commit-character  { name, folder, archetype, appearance, definition, voice, traits, brief }
//   Persists the chosen candidate: creates the folder + writes character.json (no art yet).
async function handleCommitCharacter(req, res) {
  const b = await readJsonBody(req);
  const base = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters');
  let existing = [];
  try { existing = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch (e) {}
  let folder = String(b.folder || b.name || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!folder) return sendJson(res, 400, { error: 'no usable folder name' });
  if (existing.includes(folder)) { let n = 2; while (existing.includes(folder + '_' + n)) n++; folder = folder + '_' + n; }
  const dir = path.join(base, folder);
  if (!isInsideRoot(dir)) return sendJson(res, 403, { error: 'escapes root' });
  fs.mkdirSync(path.join(dir, 'appearances'), { recursive: true });
  const record = { name: b.name || folder, folder, archetype: b.archetype || '', appearance: b.appearance || '', definition: b.definition || '', voice: b.voice || '', traits: Array.isArray(b.traits) ? b.traits : [], brief: b.brief || '', created: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'character.json'), JSON.stringify(record, null, 2));
  return sendJson(res, 200, { ok: true, ...record });
}

// GET /api/author/world  → character meta objects + location folders in the pride world
function handleAuthorWorld(req, res) {
  const base = path.join(ROOT, 'worlds', 'pride-and-prejudice');
  const listDirs = (p) => { try { return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name); } catch (e) { return []; } };
  const characters = listDirs(path.join(base, 'characters')).map(folder => {
    const cdir = path.join(base, 'characters', folder);
    let meta = {};
    try { meta = JSON.parse(fs.readFileSync(path.join(cdir, 'character.json'), 'utf8')); } catch (e) {}
    const hasArt = fs.existsSync(path.join(cdir, 'appearances', 'pride.png'));
    return { folder, name: meta.name || '', archetype: meta.archetype || '', definition: meta.definition || '', hasArt };
  });
  return sendJson(res, 200, { characters, locations: listDirs(path.join(base, 'locations')) });
}

// POST /api/author/delete-character  { folder }  — only deletes art-less characters (initials-only)
async function handleDeleteCharacter(req, res) {
  const b = await readJsonBody(req);
  const folder = String(b.folder || '').trim();
  if (!/^[a-z0-9][a-z0-9_]*$/i.test(folder)) return sendJson(res, 400, { error: 'bad folder' });
  if (folder === 'arabella_frost') return sendJson(res, 400, { error: 'cannot delete the player character' });
  const dir = path.join(ROOT, 'worlds', 'pride-and-prejudice', 'characters', folder);
  if (!isInsideRoot(dir)) return sendJson(res, 403, { error: 'escapes root' });
  if (fs.existsSync(path.join(dir, 'appearances', 'pride.png'))) return sendJson(res, 400, { error: 'character has portrait art — refusing to delete' });
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { return sendJson(res, 500, { error: String(e.message || e) }); }
  return sendJson(res, 200, { ok: true, folder });
}

// GET /api/author/asset-status?paths=a,b,c  → which relPaths exist on disk
function handleAssetStatus(req, res, parsed) {
  const list = String((parsed.query.paths || '')).split(',').filter(Boolean);
  const out = {};
  list.forEach(rel => { try { out[rel] = fs.existsSync(path.join(ROOT, rel)); } catch (e) { out[rel] = false; } });
  return sendJson(res, 200, { status: out });
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
    streamFile(filePath, res, req, stat);
  });
}

function streamFile(filePath, res, req, stat) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  // no-store + no validators = browser can NEVER serve a stale copy (dev only)
  const headers = { 'content-type': mime, 'cache-control': 'no-store, no-cache, must-revalidate, max-age=0', 'pragma': 'no-cache', 'expires': '0', 'access-control-allow-origin': '*', 'accept-ranges': 'bytes' };   // CORS: lets tools (e.g. a Miro tab) fetch local assets
  const size = stat ? stat.size : (fs.statSync(filePath).size);
  // HTTP Range support: Safari refuses to play <video> from a server that answers 200 to a byte-range request
  const range = req && req.headers && req.headers.range;
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m && size > 0) {
    let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
    let end = (m[1] !== '' && m[2] !== '') ? Number(m[2]) : size - 1;
    if (end >= size) end = size - 1;
    if (isNaN(start) || isNaN(end) || start > end || start >= size) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end(); }
    headers['content-range'] = 'bytes ' + start + '-' + end + '/' + size;
    headers['content-length'] = end - start + 1;
    res.writeHead(206, headers);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }
  headers['content-length'] = size;
  res.writeHead(200, headers);
  if (req && req.method === 'HEAD') return res.end();
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
    if (req.method === 'GET'  && parsed.pathname === '/api/list-appearances') return handleListAppearances(req, res, parsed);
    if (req.method === 'POST' && parsed.pathname === '/api/author/script') return handleAuthorScript(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/gen-asset') return handleGenAsset(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/freepik/status') return handleFreepikStatus(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/higgsfield/status') return handleHfStatus(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/higgsfield/generate') return handleHfGenerate(req, res);
    if ((req.method === 'GET' || req.method === 'POST') && parsed.pathname === '/api/image-model') return handleImageModel(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/freepik/generate') return handleFreepikGenerate(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/asset-status') return handleAssetStatus(req, res, parsed);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/world') return handleAuthorWorld(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/episode-locations') return handleEpLocs(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/location-upsert') return handleLocationUpsert(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/location-delete') return handleLocationDelete(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/assign-episode') return handleAssignEpisode(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/episodes') return handleEpisodesList(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/episodes-save') return handleEpisodesSave(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/suitors') return handleSuitorsList(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/story-map') return handleStoryMap(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/save-unlocks') return handleSaveUnlocks(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/save-story-pos') return handleSaveStoryPos(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/clear-unlock') return handleClearUnlock(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/map-locations') return handleMapLocations(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/map-locations-save') return handleMapLocationsSave(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/add-placeholder') return handleAddPlaceholder(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/archive-location') return handleArchiveLocation(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/add-character') return handleAddCharacter(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/suggest-characters') return handleSuggestCharacters(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/generate-character') return handleGenerateCharacter(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/expand-script') return handleExpandScript(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/commit-character') return handleCommitCharacter(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/delete-character') return handleDeleteCharacter(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/suggest-locations') return handleSuggestLocations(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/whispers') return handleWhispers(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/whispers') return handleSaveWhispers(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/encounters') return handleEncounters(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/encounters') return handleSaveEncounters(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/map-fog') return handleFog(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/map-fog') return handleSaveFog(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/api/author/map-roads') return handleRoads(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/author/map-roads') return handleSaveRoads(req, res);
  } catch (e) {
    return sendJson(res, 500, { error: String(e && e.message || e) });
  }

  // Default → static file
  serveStatic(req, res, parsed);
});

try { mirrorEpLoc(); } catch (e) {}  // keep episode-locations.json in sync with the master on boot
server.listen(PORT, () => {
  console.log(`\n  roles.ai dev server`);
  console.log(`  → http://localhost:${PORT}/`);
  console.log(`  → http://localhost:${PORT}/?dev=keys   (with dev settings)`);
  console.log(`  → http://localhost:${PORT}/editor.html (editor)\n`);
  console.log(`  Writes go to disk under ${ROOT}/worlds/\n`);
});
