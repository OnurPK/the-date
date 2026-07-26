#!/usr/bin/env python3
"""
Netherfield Ball — ara sahne generator (OpenAI gpt-image-2).

Runs on YOUR machine (this Cowork sandbox blocks api.openai.com, so it can't
run here). Reads the API key from the OPENAI_API_KEY env var — the key is never
written into this file.

USAGE
  export OPENAI_API_KEY=sk-...                 # your key
  python gen_scenes.py s1a                     # ONE test scene
  python gen_scenes.py s1a s3c s5b             # a few
  python gen_scenes.py --all                   # all 23

Reference-guided (character + location consistency):
  Run from the repo root (…/roles-ai). If the referenced sprite / background
  files exist on disk, they're attached via the images EDITS endpoint so the
  render matches your existing designs. If not found (or --no-refs), it falls
  back to plain text-to-image generation.

Output: writes <id>.png into
  worlds/pride-and-prejudice/episodes/the-newcomer/the-netherfield-ball/cutscenes/
(override with --out DIR)
"""

import os, sys, base64, json, mimetypes, ssl, time, socket, urllib.request, urllib.error

# gpt-image-2 can be slow, especially edits with several reference images.
# Give each request a generous timeout and retry so one slow render never
# kills the whole batch.
TIMEOUT = 300          # seconds per request
RETRIES = 3            # attempts per scene

# macOS python.org builds don't use the system cert store; use certifi's CA
# bundle so TLS verification works without "Install Certificates.command".
def _ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ModuleNotFoundError:
        return ssl.create_default_context()
SSL_CTX = _ssl_context()

MODEL = "gpt-image-2"                      # per your account (not image-1)
API = "https://api.openai.com/v1/images"

WORLD = "worlds/pride-and-prejudice"
EPISODE = f"{WORLD}/episodes/the-newcomer/the-netherfield-ball"
OUT_DEFAULT = f"{EPISODE}/cutscenes"

STYLE = ("Regency England circa 1810s, warm candlelit Netherfield ballroom, "
         "painterly romantic-illustration look, soft light, shallow depth of field, "
         "gilt and blush and deep-green palette, no text, no modern elements.")

# character id -> sprite reference file
CHARS = {c: f"{WORLD}/characters/{c}/appearances/pride.png" for c in [
    "arabella_frost", "mr_darcy", "mr_wickham", "mr_bingley",
    "miss_bingley", "mrs_bennet", "charlotte_lucas", "lydia_bennet", "mr_collins"]}

# location id -> background/scene reference file
LOCS = {
    "ballroom":        f"{WORLD}/locations/netherfield-ball/explore/ballroom.png",
    "officers-corner": f"{WORLD}/locations/netherfield-ball/backgrounds/officers-corner.jpg",
    "alcove":          f"{WORLD}/locations/netherfield-ball/backgrounds/alcove-shadow.jpg",
    "supper":          f"{WORLD}/locations/netherfield-ball/explore/supper.png",
    "dance":           f"{EPISODE}/cutscenes/the-dance-set.jpg",
    "terrace":         f"{WORLD}/locations/netherfield-ball/explore/terrace.png",
    "thinning":        f"{WORLD}/locations/netherfield-ball/backgrounds/thinning-ball.jpg",
    "carriage":        f"{EPISODE}/cutscenes/carriage-night.jpg",
}

PORTRAIT = "1024x1536"   # ~9:16
SQUARE   = "1024x1024"   # 1:1

# id: (size, [character ids], location id, prompt-subject)
SCENES = {

 # ---- COMBAT STORYBOARD - Arabella vs Darcy (The Look -> The Interloper -> The Dance) ----
 "cb_intro": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "Across the crowded candlelit ballroom Arabella locks eyes with Mr Darcy over the heads of the dancers - a cool deliberate dare, the instant a private duel begins; she is composed, unhurried, giving nothing away. Leave the upper area uncluttered for a title."),
 "cb_look": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "Arabella holds Darcy's gaze across the ballroom floor, drawing him in with her eyes yet perfectly composed - quietly alluring but careful not to seem eager, hiding what it costs her; Darcy stands still among the guests, caught, unable to look away."),
 "cb_moves": (PORTRAIT, ["mr_darcy","arabella_frost"], "ballroom",
   "Mr Darcy breaks first and begins crossing the ballroom floor toward Arabella, the guests parting before him; she watches him come, composed and quietly certain, not triumphant."),
 "cb_interloper": (PORTRAIT, ["arabella_frost","mr_collins","mr_darcy"], "ballroom",
   "Before Darcy reaches her, the pompous clergyman Mr Collins bustles in front of Arabella, bowing and fawning as he presumes to claim her hand for the next dance, blocking her path; over his shoulder Darcy is still approaching. Arabella keeps a gracious but cornered smile."),
 "cb_sendoff": (PORTRAIT, ["arabella_frost","mr_collins"], "ballroom",
   "Arabella deftly and graciously extricates herself from Mr Collins - a polite practised turn that redirects him without a scene - keeping the floor open; Darcy nearly upon them."),
 "cb_dance": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "Arabella and Mr Darcy take the floor together, the set forming around them, the whole candlelit room watching; they face each other a formal arm's length apart, poised and charged - the duel joined."),
 "cb_upperhand": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "Mid-dance Arabella lands the decisive line; Darcy's guarded composure cracks for an instant, a flicker of real feeling breaking through the reserve, the two very close, the watching room a golden blur."),
 "cb_win": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "The music ended, Arabella and Darcy stand a single breath apart - everything said, nothing settled; his reserve undone, his gaze fixed on her with unmistakable helpless regard. Warm, romantic, radiant. Leave the lower area open for a caption."),
 "cb_lose": (PORTRAIT, ["arabella_frost","mr_darcy"], "ballroom",
   "Arabella turns away first, composed but shut; Darcy closes back behind his pride, the charged moment lost between them. Cooler, dimmer, a little melancholy. Leave the lower area open for a caption."),
 "s1a_arrival_doorway": (PORTRAIT, ["arabella_frost"], "ballroom",
   "Arabella framed in the tall candlelit doorway of a grand ballroom, warm light spilling past her, a blurred crowd half-turning to look; poised, chin up, faintly amused."),
 "s1b_darcy_across": (PORTRAIT, ["mr_darcy"], "ballroom",
   "Mr Darcy standing across the ballroom, seen at half-length past the blurred shoulders of dancers, still and unreadable, proud, candle-glow on one cheek."),
 "s1c_bingley_toast": (PORTRAIT, ["mr_bingley"], "ballroom",
   "Mr Bingley beaming with open delight, a wine glass raised in a toast, mid-laugh, warmly lit; the bright ball behind him."),
 "s1d_officers_wall": (PORTRAIT, ["mr_wickham"], "ballroom",
   "A cluster of militia officers in red coats loitering by the ballroom wall, one of them (Wickham) straightening and glancing over with a charming half-smile."),
 "s2a_wickham_charm": (PORTRAIT, ["mr_wickham","arabella_frost"], "officers-corner",
   "Mr Wickham leaning in confidentially toward Arabella in a candlelit corner, a disarming practised smile; she listens, cool and unreadable."),
 "s2b_wickham_wound": (PORTRAIT, ["mr_wickham"], "officers-corner",
   "Mr Wickham at half-length in the candlelit corner, his face arranged into a sorrow a touch too well-composed, eyes cast down, one hand near his chest; the faint sense of a performance."),
 "s2c_darcy_watches": (PORTRAIT, ["mr_darcy"], "ballroom",
   "Across the room, Mr Darcy gone rigid, jaw tight, watching coldly; a blur of dancers between. Barely-contained jealousy under a controlled surface."),
 "s3a_drift_shadow": (PORTRAIT, ["arabella_frost"], "alcove",
   "Arabella half in shadow by tall dark windows, poised and still, pretending to study her glove while listening; warm ball-light glowing beyond the alcove."),
 "s3b_caroline_darcy": (PORTRAIT, ["miss_bingley","mr_darcy"], "alcove",
   "Caroline Bingley and Mr Darcy in a dim alcove, unaware they are overheard; Caroline speaking with elegant contempt, Darcy half-listening, low intimate candlelight."),
 "s3c_darcy_confess": (PORTRAIT, ["mr_darcy"], "alcove",
   "Mr Darcy at half-length in the dim alcove, his guard fully down for once — something close to pain and longing in his face, low candlelight."),
 "s3d_arabella_coal": (PORTRAIT, ["arabella_frost"], "alcove",
   "Arabella at half-length near the tall dark windows, lit with private triumph, a hand pressed lightly to her chest, eyes bright, the smallest secret smile."),
 "s4a_table_wide": (PORTRAIT, ["mrs_bennet","arabella_frost","mr_darcy"], "supper",
   "A long silver-laid supper table seen down its length, candelabra glowing; Mrs Bennet mid-declaration with theatrical pride, a guest or two visibly wincing, Darcy cold and still further down."),
 "s4b_darcy_glass": (PORTRAIT, ["mr_darcy"], "supper",
   "Mr Darcy at the supper table seen at half-length, setting his wine glass down with cold deliberate care, eyes hooded, filing away every word; candlelit."),
 "s4c_charlotte_lean": (PORTRAIT, ["charlotte_lucas","arabella_frost"], "supper",
   "Charlotte Lucas leaning close to Arabella at the supper table, plain and kind, real warning in her eyes; Arabella listening with a wry tilt."),
 "s4d_lydia_whisper": (PORTRAIT, ["lydia_bennet","arabella_frost"], "supper",
   "Young Lydia giggling and leaning across the supper table with mischief toward Arabella, candles between them, silver and lace."),
 "s5a_take_the_floor": (PORTRAIT, ["arabella_frost","mr_darcy"], "dance",
   "Arabella and Mr Darcy taking their places for a dance, the set forming around them, the ballroom a bright warm blur; charged, formal, poised on the edge of a duel."),
 "s5b_close_turn": (PORTRAIT, ["arabella_frost","mr_darcy"], "dance",
   "A close turn of the dance, Arabella and Darcy's faces near, hands nearly touching, the whole room falling away into golden blur; electric restraint."),
 "s5c_wickham_needle": (PORTRAIT, ["arabella_frost","mr_darcy"], "dance",
   "Mid-figure of the dance, Arabella wearing a sly bright look as she says something cutting, Darcy beginning to stiffen; the blade about to be drawn."),
 "s5d_darcy_ice": (PORTRAIT, ["mr_darcy"], "dance",
   "Mr Darcy mid-dance seen at half-length, his face going to winter, the warmth shutting off, eyes cold and wounded beneath control."),
 "s5e_vertigo": (PORTRAIT, ["arabella_frost","mr_darcy"], "dance",
   "A swirling moment of the dance, the floor seeming to tilt, Arabella's composure cracking for one beat as she truly looks at Darcy; motion blur of gowns and candlelight."),
 "s6a_terrace_cold": (PORTRAIT, ["arabella_frost"], "terrace",
   "Arabella alone on a cold stone terrace at night, her breath faint in the air, the golden ball glowing through tall windows behind her; caught between amusement and alarm."),
 "s6b_last_look": (PORTRAIT, ["arabella_frost","mr_darcy"], "thinning",
   "Across an emptying ballroom, candles guttering and footmen snuffing them, Arabella and Darcy's eyes meeting one last time over the wreckage of the evening; taut, unspoken."),
 "s6c_carriage_window": (PORTRAIT, ["mr_darcy"], "carriage",
   "View from inside a dark night carriage: a single bright lit window of Netherfield shrinking in the distance, a still dark figure (Darcy) watching the carriage lamps go; deep night blues vs one warm window."),
}


def refs_for(char_ids, loc_id, use_refs):
    if not use_refs:
        return []
    files = []
    for c in char_ids:
        p = CHARS.get(c)
        if p and os.path.exists(p):
            files.append(p)
    lp = LOCS.get(loc_id)
    if lp and os.path.exists(lp):
        files.append(lp)
    return files


def multipart(fields, files):
    """Build a multipart/form-data body. files = list of (fieldname, path)."""
    boundary = "----netherfield" + base64.urlsafe_b64encode(os.urandom(9)).decode()
    body = b""
    for k, v in fields.items():
        body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for field, path in files:
        fn = os.path.basename(path)
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            data = f.read()
        body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; "
                 f"filename=\"{fn}\"\r\nContent-Type: {ctype}\r\n\r\n").encode()
        body += data + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


def generate(scene_id, key, out_dir, use_refs):
    size, chars, loc, subject = SCENES[scene_id]
    prompt = f"{subject} {STYLE}"
    refs = refs_for(chars, loc, use_refs)

    if refs:  # reference-guided via the edits endpoint
        prompt = ("Using the attached images ONLY as character-design and setting references "
                  "(faces, costume, palette, room) — do not copy their composition — paint a NEW scene: "
                  + prompt)
        fields = {"model": MODEL, "prompt": prompt, "size": size}
        files = [("image[]", p) for p in refs]
        body, ctype = multipart(fields, files)
        url = f"{API}/edits"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": ctype}
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    else:     # plain text-to-image
        url = f"{API}/generations"
        payload = json.dumps({"model": MODEL, "prompt": prompt, "size": size}).encode()
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    print(f"[{scene_id}] {size}  refs={len(refs)}  → requesting… (up to {TIMEOUT}s)")
    out = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
                out = json.loads(resp.read().decode())
            break
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:400]
            print(f"[{scene_id}] HTTP {e.code}: {body}")
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                print(f"[{scene_id}] retry {attempt}/{RETRIES-1} in 6s…"); time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{scene_id}] timed out (attempt {attempt}/{RETRIES}).")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except urllib.error.URLError as e:
            msg = str(getattr(e, "reason", e))
            if "CERTIFICATE_VERIFY_FAILED" in msg or "SSL" in msg:
                print(f"[{scene_id}] TLS cert error. Fix:  pip3 install certifi"); return False
            print(f"[{scene_id}] network error (attempt {attempt}/{RETRIES}): {msg}")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except Exception as e:
            print(f"[{scene_id}] unexpected error: {e}"); return False
    if out is None:
        return False

    b64 = out["data"][0]["b64_json"]
    os.makedirs(out_dir, exist_ok=True)
    dest = os.path.join(out_dir, scene_id + ".png")
    with open(dest, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"[{scene_id}] saved → {dest}")
    return True


def main():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    args = [a for a in sys.argv[1:] if a not in ("--all", "--no-refs")]
    use_refs = "--no-refs" not in sys.argv
    out_dir = OUT_DEFAULT
    if "--out" in args:
        i = args.index("--out"); out_dir = args[i+1]; del args[i:i+2]
    ids = list(SCENES) if "--all" in sys.argv else (args or ["s1a_arrival_doorway"])
    ok, fail = [], []
    for sid in ids:
        if sid not in SCENES:
            print(f"skip unknown id: {sid}"); continue
        try:
            good = generate(sid, key, out_dir, use_refs)
        except Exception as e:
            print(f"[{sid}] batch-level error, skipping: {e}"); good = False
        (ok if good else fail).append(sid)
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("Re-run the failed ones:")
        print("  python3 gen_scenes.py " + " ".join(fail))


if __name__ == "__main__":
    main()
