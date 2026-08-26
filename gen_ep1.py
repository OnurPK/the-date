#!/usr/bin/env python3
"""
Episode 1 "A Caller at the House" — location backdrops + cutscenes + intro bg.
Same idiom as gen_scenes.py (urllib, gpt-image-2, reference-guided edits, 9:16 2K).

Runs on YOUR machine. Key from OPENAI_API_KEY (never written to file).
Each shot attaches the RIGHT references (photoreal room / cutscene art, NOT the
character concept sheets) so the style matches.

USAGE  (run from repo root …/roles-ai)
  export OPENAI_API_KEY=sk-...
  python3 gen_ep1.py                 # all 9
  python3 gen_ep1.py parlour the_spill
  python3 gen_ep1.py --list

Outputs go straight to the folders the engine will read.
Everything is saved as .png for reliable decoding.
"""

import os, sys, base64, json, mimetypes, ssl, time, socket, urllib.request, urllib.error

TIMEOUT = 300
RETRIES = 3
MODEL = "gpt-image-2"
API   = "https://api.openai.com/v1/images"
# cast-large backdrops get PANNED, so they are wide (3:2); full-frame
# cutscenes stay portrait (9:16). Both ~2K, dimensions divisible by 16.
SIZE_LOC = "2496x1664"       # 3:2 landscape (location backdrops — room to pan)
SIZE_CUT = "1440x2560"       # 9:16 portrait (cutscenes)

def _ssl():
    try:
        import certifi; return ssl.create_default_context(cafile=certifi.where())
    except ModuleNotFoundError: return ssl.create_default_context()
SSL_CTX = _ssl()

W    = "worlds/pride-and-prejudice"
EP   = f"{W}/episodes/the-newcomer/a-caller-at-the-house"
LONG = f"{W}/locations/longbourn/explore"
ASH  = f"{W}/locations/ashbourne-court"

# reference sets (attached as image[] so the render matches existing art)
REF_LOC = [f"{W}/locations/netherfield-ball/backgrounds/thinning-ball.jpg",
           f"{W}/locations/netherfield-ball/explore/ballroom.png"]
REF_CUT = [f"{W}/episodes/the-newcomer/the-netherfield-ball/cutscenes/carriage-night.jpg",
           f"{W}/episodes/the-newcomer/the-netherfield-ball/cutscenes/the-dance-set.jpg"]

LOCSTYLE = ("cinematic painterly-photoreal Regency interior, England circa 1810s, warm natural "
    "light, rich period detail, soft shallow depth of field, an EMPTY room with the foreground and "
    "centre left clear and no people, evocative and inviting, gilt / blush / dark-wood / deep-green palette")
CUTSTYLE = ("cinematic painterly-photoreal illustration, Regency England circa 1810s, warm candlelit "
    "or daylit, dramatic soft lighting, shallow depth, romantic and atmospheric, period-accurate")
NEG = ("Things not in the picture: text, letters, watermark, signature, modern objects, cars, power "
    "lines, distorted faces, distorted hands, extra limbs, cartoonish")

# id: (style, refs, out_path, scene description)
SHOTS = {
  # ---- A · location backdrops (foreground clear) ----
  "parlour": (LOCSTYLE, REF_LOC, f"{LONG}/parlour.png",
    "a warm, genteel-but-modest English drawing room by soft morning light: a settee and chairs "
    "around a low tea table, a pianoforte in the far corner, tall windows with muslin curtains, a "
    "small fire, homely and lived-in rather than grand; the centre of the room clear"),
  "study": (LOCSTYLE, REF_LOC, f"{LONG}/study.png",
    "a cramped scholar's study, floor-to-ceiling books, a cluttered desk with papers and a globe, a "
    "single warm lamp, a worn armchair, dust in a shaft of light; scholarly, poor, beloved; foreground clear"),
  "window_nook": (LOCSTYLE, REF_LOC, f"{LONG}/window_nook.png",
    "a tall drawing-room window and a quiet alcove looking onto an autumn garden, soft late-afternoon "
    "light, a window seat, a private corner apart from the room; intimate and still; foreground clear"),
  # ---- B · cutscenes ----
  "arrival": (CUTSTYLE, REF_CUT, f"{EP}/cutscenes/arrival.png",
    "a modest but handsome English country house at golden morning, a fine carriage drawing up the "
    "gravel sweep, a maid peering from a window, quiet anticipation before a visit"),
  "at_the_pianoforte": (CUTSTYLE, REF_CUT, f"{EP}/cutscenes/at_the_pianoforte.png",
    "a young woman seated at a pianoforte in a sunlit parlour, seen from behind and to the side so "
    "her face is turned away, her hands on the keys; a gentleman stands a little apart, listening, "
    "caught; candles and warm light"),
  "the_spill": (CUTSTYLE, REF_CUT, f"{EP}/cutscenes/the_spill.png",
    "a kind gentleman crouched on a parlour floor gently gathering pieces of a broken tea-cup and "
    "reassuring a small frightened housemaid in cap and apron, a fallen tray beside them, warm "
    "daylight; a quiet act of decency"),
  "the_save": (CUTSTYLE, REF_CUT, f"{EP}/cutscenes/the_save.png",
    "an over-eager Regency matron mid-boast at a tea table, a polite gentleman listening with faint "
    "discomfort, her clever daughter leaning in to smoothly redirect the talk; a drawing room, warm "
    "light, social tension under good manners"),
  "carriage_away": (CUTSTYLE, REF_CUT, f"{EP}/cutscenes/carriage_away.png",
    "seen from a lit doorway at dusk, a carriage's lamps receding down a tree-lined lane, one figure "
    "watching from the step, blue evening against warm lamplight; quiet resolve"),
  # ---- C · suitor intro backdrop ----
  "ashbourne_court": (LOCSTYLE, REF_LOC, f"{ASH}/cover.png",
    "a handsome, well-kept country manor at warm dusk, mellow stone and lit windows, neat lawns and "
    "an avenue of limes, comfortable and respectable rather than showy; centre clear"),
}

def build(style, desc): return style + "\n\n" + desc + "\n\n" + NEG

def multipart(fields, files):
    b = "----ep1" + base64.urlsafe_b64encode(os.urandom(9)).decode(); body = b""
    for k, v in fields.items():
        body += f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for field, path in files:
        ct = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f: data = f.read()
        body += (f"--{b}\r\nContent-Disposition: form-data; name=\"{field}\"; "
                 f"filename=\"{os.path.basename(path)}\"\r\nContent-Type: {ct}\r\n\r\n").encode()
        body += data + b"\r\n"
    body += f"--{b}--\r\n".encode()
    return body, f"multipart/form-data; boundary={b}"

def generate(sid, key):
    style, refs, out, desc = SHOTS[sid]
    size = SIZE_LOC if style == LOCSTYLE else SIZE_CUT   # backdrops 3:2, cutscenes 9:16
    prompt = build(style, desc)
    refs = [p for p in refs if os.path.exists(p)]
    if refs:
        body, ct = multipart({"model": MODEL, "prompt": prompt, "size": size},
                             [("image[]", p) for p in refs])
        req = urllib.request.Request(f"{API}/edits", data=body,
            headers={"Authorization": f"Bearer {key}", "Content-Type": ct}, method="POST")
    else:
        payload = json.dumps({"model": MODEL, "prompt": prompt, "size": size}).encode()
        req = urllib.request.Request(f"{API}/generations", data=payload,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")

    print(f"[{sid}] {size}  refs={len(refs)}  → requesting… (up to {TIMEOUT}s)")
    out_json = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as r:
                out_json = json.loads(r.read().decode())
            break
        except urllib.error.HTTPError as e:
            print(f"[{sid}] HTTP {e.code}: {e.read().decode()[:300]}")
            if e.code in (429,500,502,503,504) and attempt < RETRIES: time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{sid}] timed out ({attempt}/{RETRIES})"); time.sleep(3)
            if attempt < RETRIES: continue
            return False
        except Exception as e:
            print(f"[{sid}] error: {e}"); return False
    if out_json is None: return False
    png = base64.b64decode(out_json["data"][0]["b64_json"])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "wb") as f: f.write(png)
    print(f"[{sid}] saved → {out}")
    return True

def main():
    if "--list" in sys.argv: print("\n".join(SHOTS)); return
    key = os.environ.get("OPENAI_API_KEY")
    if not key: sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    ids = [a for a in sys.argv[1:] if not a.startswith("-")] or list(SHOTS)
    ok, fail = [], []
    for sid in ids:
        if sid not in SHOTS: print("skip unknown:", sid); continue
        (ok if generate(sid, key) else fail).append(sid)
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail: print("Re-run:  python3 gen_ep1.py " + " ".join(fail))

if __name__ == "__main__":
    main()
