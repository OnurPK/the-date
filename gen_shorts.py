#!/usr/bin/env python3
"""
Pride & Prejudice — SHORTS cutscene generator (OpenAI gpt-image-2).

Same engine as gen_scenes.py — reference-guided renders that keep your
character designs consistent. Runs on YOUR machine (this Cowork sandbox
blocks api.openai.com). Reads the key from OPENAI_API_KEY; never stored here.

USAGE
  export OPENAI_API_KEY=sk-...
  python gen_shorts.py                          # runs the default trial (sh06)
  python gen_shorts.py sh06_newcomer_season     # ONE
  python gen_shorts.py sh06_newcomer_season sh09_regiments_tailor
  python gen_shorts.py --all                     # every defined short

Reference-guided (character + location consistency):
  Run from the repo root (…/roles-ai). Character sprites are attached via the
  images EDITS endpoint so faces/costume/palette match your existing designs.
  Locations without a reference image on disk are described in the prompt text
  (only 'ballroom' currently has a reference file).

Output: writes <id>.png into
  worlds/pride-and-prejudice/shorts/
(override with --out DIR). Portrait 1024x1536 — matches the full-screen reels.

All 10 shorts are defined. Run one to spot-check, then `--all` for the batch.
Missing ids can be re-run individually (printed at the end of a batch).
"""

import os, sys, base64, json, mimetypes, ssl, time, socket, urllib.request, urllib.error

TIMEOUT = 300          # seconds per request
RETRIES = 3            # attempts per scene

def _ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ModuleNotFoundError:
        return ssl.create_default_context()
SSL_CTX = _ssl_context()

MODEL = "gpt-image-2"
API = "https://api.openai.com/v1/images"

WORLD = "worlds/pride-and-prejudice"
OUT_DEFAULT = f"{WORLD}/shorts"

# Shared house style for every short. Location + time-of-day live in each
# scene's subject line, so this stays world-general (not ballroom-specific).
STYLE = ("Regency England, early 1810s. Painterly romantic-illustration cutscene art, "
         "cinematic composition, soft naturalistic light, shallow depth of field, "
         "rich but muted period palette, portrait orientation. "
         "No text, no lettering, no captions, no watermark, no signature, no modern elements.")

# character id -> sprite reference file (same convention as gen_scenes.py)
CHARS = {c: f"{WORLD}/characters/{c}/appearances/pride.png" for c in [
    "arabella_frost", "elizabeth_bennet", "jane_bennet", "mr_darcy",
    "mr_wickham", "mr_bingley", "mr_collins", "mrs_bennet",
    "charlotte_lucas", "miss_bingley", "lydia_bennet", "sir_william"]}

# location id -> reference file. Only the ballroom has one; every other short
# describes its setting in text (refs_for() skips ids not found here / on disk).
LOCS = {
    "ballroom": f"{WORLD}/locations/netherfield-ball/explore/ballroom.png",
}

PORTRAIT = "1024x1536"   # ~9:16, matches the reels
SQUARE   = "1024x1024"

# id: (size, [character ids with sprites], location id, prompt-subject)
# Invented protagonists (a tailor, a housekeeper) have no sprite — only the
# canon character they share the scene with is listed, and the protagonist is
# described in the subject text.
SHORTS = {

 # --- TRIAL A — both a character ref AND a location ref (full consistency test)
 "sh06_newcomer_season": (PORTRAIT, ["arabella_frost", "mr_darcy"], "ballroom",
   "A grand candlelit ball. Arabella, poised and newly arrived, stands near the "
   "foreground and meets the arrested gaze of Mr Darcy across the crowded floor; "
   "a charged first-glance tension between them, dancers blurred in the warm golden "
   "space between. Arabella sharp in focus, Darcy a still figure beyond."),

 # --- TRIAL B — invented protagonist (no sprite) + a canon ref + text-only location
 "sh09_regiments_tailor": (PORTRAIT, ["mr_wickham"], "meryton-tailor",
   "A cramped Meryton tailor's shop hung with scarlet militia coats, warm lamplight, "
   "evening. In the foreground an ageing tailor in an apron pauses over a dark stain "
   "he has found on an officer's red coat, his brow tight with unease. In the shop "
   "doorway, at ease and half-smiling, stands Mr Wickham in shirtsleeves. "
   "Intrigue, a secret about to surface."),

 # --- A) canon scenes, retold from a fresh POV
 "sh01_tolerable": (PORTRAIT, ["elizabeth_bennet", "mr_darcy"], "assembly-rooms",
   "A crowded country-assembly ballroom by candlelight. In the foreground Elizabeth Bennet "
   "sits at the edge of the dancing, half-turned, having just overheard a slight — stung "
   "pride sharpening into wry amusement on her face. Across the bright blurred room the proud, "
   "aloof figure of Mr Darcy is already turning away. Elizabeth sharp in focus."),

 "sh02_three_miles": (PORTRAIT, ["elizabeth_bennet"], "country-lane",
   "Elizabeth Bennet walking a muddy country lane on a grey overcast morning, the hem of her "
   "gown splashed dark with mud, cheeks wind-flushed, eyes bright and determined. Wet fields "
   "and hedgerows around her; the great house of Netherfield sits distant on a low hill ahead. "
   "Solitary, resolute."),

 "sh03_parsonage_proposal": (PORTRAIT, ["mr_collins", "elizabeth_bennet"], "longbourn-parlour",
   "A modest Regency drawing room in warm daylight. Mr Collins, pompous and earnest, is down "
   "on one knee mid-proposal, a hand pressed to his heart. Elizabeth Bennet stands with "
   "barely-contained dismay and wry disbelief, edging half a step back. A comedy of manners — "
   "his oblivious fervour, her horror."),

 # --- B) what-if scenarios
 "sh04_if_she_said_yes": (PORTRAIT, ["elizabeth_bennet"], "hunsford-window",
   "Elizabeth Bennet stands alone at a small parsonage window in thin cold morning light, a "
   "plain wedding band on her hand, her expression composed but hollow. Beyond the glass, the "
   "too-orderly clipped garden of a great estate. A quiet, aching sense of a life that might "
   "have been."),

 "sh05_letter_never": (PORTRAIT, ["elizabeth_bennet", "mr_wickham"], "meryton-street",
   "A Meryton street of shopfronts in soft golden afternoon light. Charming Mr Wickham, in an "
   "officer's scarlet coat, leans in speaking earnestly to Elizabeth Bennet, who listens with "
   "open sympathy and trust — the lie quietly taking root. A faint unease under the warmth. "
   "Two figures in focus."),

 "sh07_other_bride": (PORTRAIT, ["jane_bennet", "mr_bingley"], "longbourn-evening",
   "Gentle Jane Bennet stands at a Longbourn parlour window in soft evening light, her face "
   "wistful and sad, one hand resting on the sill. Through the window, in the lane beyond, the "
   "figure of Mr Bingley has just arrived on foot — returned too late. Quiet heartbreak; she "
   "has not yet turned to see him. Jane in focus, Bingley a soft figure outside."),

 # --- C) invented side-character stories in known locations
 "sh08_housekeepers_ledger": (PORTRAIT, ["mrs_bennet"], "longbourn-night",
   "A Longbourn back-parlour late at night, lit by a single candle. In the foreground an "
   "ageing housekeeper in a plain cap bends over an open leather household ledger — a page has "
   "been torn out, and her face is tight with alarm. Through a doorway behind her, the blurred "
   "figure of Mrs Bennet. A domestic mystery, low warm light."),

 "sh10_charlottes_arithmetic": (PORTRAIT, ["charlotte_lucas"], "lucas-lodge-night",
   "Charlotte Lucas sits alone by a low fire at night, plain and perfectly composed, doing the "
   "quiet arithmetic of her own future. A candle, a folded letter and a gentleman's calling "
   "card lie on the small table before her. Pragmatic, faintly melancholy resolve — love "
   "weighed against security."),
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
    boundary = "----pandpshorts" + base64.urlsafe_b64encode(os.urandom(9)).decode()
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
    size, chars, loc, subject = SHORTS[scene_id]
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
    ids = list(SHORTS) if "--all" in sys.argv else (args or ["sh06_newcomer_season"])
    ok, fail = [], []
    for sid in ids:
        if sid not in SHORTS:
            print(f"skip unknown id: {sid}"); continue
        try:
            good = generate(sid, key, out_dir, use_refs)
        except Exception as e:
            print(f"[{sid}] batch-level error, skipping: {e}"); good = False
        (ok if good else fail).append(sid)
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("Re-run the failed ones:")
        print("  python3 gen_shorts.py " + " ".join(fail))


if __name__ == "__main__":
    main()
