#!/usr/bin/env python3
"""
Pose / idle generator for Episode 1 "A Caller at the House"
(OpenAI gpt-image-2, images EDITS endpoint) — same idiom as gen_suitors.py.

For each character it uses THAT character's own appearances/pride.png as the
reference image, so face / hair / costume stay identical, and only the POSE and
EXPRESSION change. It writes:
  • 3 extra IDLE variants   → pride1.png, pride2.png, pride3.png
  • 5 character-specific POSES → <name>.png
directly into  worlds/pride-and-prejudice/characters/<char>/appearances/
(plus a review copy under characters/_gen/out/poses/<char>/).

Runs on YOUR machine. Reads the key from OPENAI_API_KEY (never written to file).

USAGE  (from repo root …/roles-ai)
  export OPENAI_API_KEY=sk-...
  python3 gen_poses.py                          # ALL chars, ALL images
  python3 gen_poses.py sir_ashbourne            # one character (all its images)
  python3 gen_poses.py mrs_frost the_maid       # a few characters
  python3 gen_poses.py --only pride1,arms_crossed sir_ashbourne   # subset of images
  python3 gen_poses.py --list                   # list chars + image names
"""

import os, sys, base64, json, mimetypes, ssl, time, socket, urllib.request, urllib.error

TIMEOUT = 300
RETRIES = 3

def _ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ModuleNotFoundError:
        return ssl.create_default_context()
SSL_CTX = _ssl_context()

MODEL = "gpt-image-2"
API   = "https://api.openai.com/v1/images"
SIZE  = "1440x2560"        # 9:16 portrait at 2K

WORLD = "worlds/pride-and-prejudice"
CHARS = f"{WORLD}/characters"
OUT_DEFAULT = f"{CHARS}/_gen/out/poses"

# ---- fixed style / framing paragraphs --------------------------------------
PARA_STYLE = (
    "the SAME character shown in the reference image — keep the EXACT same face, "
    "hairstyle, skin tone and full costume, unchanged. Only the body pose and the "
    "facial expression change. A full-body single standing figure, centered, on a "
    "plain white studio background, painterly oil-and-gouache with confident visible "
    "brushstrokes and soft natural modeling, elegant Regency period-drama costume "
    "illustration matching the reference's rendering.")

PARA_NEG = (
    "The whole body must be visible head to feet, standing upright, fully inside the "
    "frame with clear margin — do NOT crop or cut off the figure. Not in the picture: "
    "text, letters, watermark, signature, extra limbs, distorted hands, distorted face, "
    "cluttered background, modern clothing, photorealistic, multiple figures, cropped "
    "body, seated, crouching, kneeling.")

# shared idle variants (subtle neutral standing poses) — used for every character
IDLES = {
    "pride1": "a relaxed neutral standing pose, weight shifted onto one leg, both hands loose at the sides, calm natural expression",
    "pride2": "an upright standing pose, one hand resting lightly at the waist, head turned slightly, composed expression",
    "pride3": "a standing three-quarter pose turned a little to one side, hands lightly clasped in front, serene expression",
}

# 5 character-specific poses each
POSES = {
    "sir_ashbourne": {
        "warm_smile":   "standing at ease with a warm kindly smile, one hand open in a gentle welcoming gesture",
        "arms_crossed": "standing with arms crossed over the chest, relaxed and confident, a faint steady smile",
        "polite_bow":   "a courteous standing bow, upper body inclined forward, one hand to the chest",
        "hand_offered": "standing and offering one hand forward in invitation, a warm open expression",
        "thoughtful":   "standing thoughtfully with one hand touching the chin, a considering gaze",
    },
    "mrs_frost": {
        "proud_boast":  "standing mid-boast, chest lifted, one arm swept outward grandly, a proud beaming expression",
        "delighted":    "standing with both hands clasped at the breast, delighted, eyes bright with excitement",
        "appraising":   "standing and looking someone up and down, chin lifted, a shrewd appraising expression",
        "with_fan":     "standing holding an open folding fan near the face, coy and self-satisfied",
        "disapproving": "standing stiffly with arms folded, lips pursed, a disapproving frown",
    },
    "arabella_frost": {
        "arms_crossed": "standing with arms crossed, an amused skeptical arch of one brow",
        "smirk":        "standing with a sly knowing smirk, weight cocked onto one hip",
        "curtsy":       "a graceful standing curtsy, skirts held lightly, a composed poised look",
        "back_turned":  "standing with the back mostly turned to the viewer, glancing back over one shoulder, cool and unreadable",
        "laughing":     "standing caught mid-laugh, head tilted back a little, genuinely delighted",
    },
    "mr_frost": {
        "reading":        "standing and reading a small open book held in both hands, absorbed and quiet",
        "dry_smile":      "standing with a dry wry half-smile, one eyebrow slightly raised",
        "hands_behind":   "standing upright with hands clasped behind the back, calm and observant",
        "spectacles":     "standing and lowering a pair of spectacles from the eyes, a thoughtful expression",
        "gentle_nod":     "standing with a gentle approving nod, a soft fond expression",
    },
    "the_maid": {
        "curtsy":         "a small standing curtsy, hands holding the edge of the apron, eyes lowered, shy",
        "holding_tray":   "standing holding a tea tray level with both hands, careful and attentive",
        "startled":       "standing startled, both hands raised a little, wide anxious eyes",
        "clutch_apron":   "standing nervously clutching the apron with both hands, timid downcast look",
        "shy_smile":      "standing with a small shy smile, hands folded in front",
    },
}

def jobs_for(char):
    """ordered {filename: prompt-fragment} = 3 idles + 5 poses"""
    out = dict(IDLES)
    out.update(POSES.get(char, {}))
    return out

def build_prompt(fragment):
    return PARA_STYLE + "\n\n" + fragment + "\n\n" + PARA_NEG

def multipart(fields, files):
    boundary = "----poses" + base64.urlsafe_b64encode(os.urandom(9)).decode()
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

def generate_one(char, name, fragment, key, out_dir):
    ref = f"{CHARS}/{char}/appearances/pride.png"
    if not os.path.exists(ref):
        print(f"[{char}/{name}] MISSING reference {ref} — skipping"); return False
    prompt = build_prompt(fragment)
    fields = {"model": MODEL, "prompt": prompt, "size": SIZE}
    body, ctype = multipart(fields, [("image[]", ref)])
    req = urllib.request.Request(f"{API}/edits", data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": ctype}, method="POST")
    print(f"[{char}/{name}] {SIZE}  → requesting… (up to {TIMEOUT}s)")
    out = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
                out = json.loads(resp.read().decode())
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:400]
            print(f"[{char}/{name}] HTTP {e.code}: {msg}")
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{char}/{name}] timed out ({attempt}/{RETRIES})")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except urllib.error.URLError as e:
            m = str(getattr(e, "reason", e))
            if "CERTIFICATE_VERIFY_FAILED" in m or "SSL" in m:
                print(f"[{char}/{name}] TLS cert error. Fix:  pip3 install certifi"); return False
            print(f"[{char}/{name}] network error ({attempt}/{RETRIES}): {m}")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except Exception as e:
            print(f"[{char}/{name}] unexpected error: {e}"); return False
    if out is None:
        return False
    png = base64.b64decode(out["data"][0]["b64_json"])
    # review copy
    rev_dir = os.path.join(out_dir, char); os.makedirs(rev_dir, exist_ok=True)
    with open(os.path.join(rev_dir, name + ".png"), "wb") as f: f.write(png)
    # live copy into the character's appearances folder (correct filename)
    dest_dir = os.path.join(CHARS, char, "appearances"); os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, name + ".png"), "wb") as f: f.write(png)
    print(f"[{char}/{name}] saved → {char}/appearances/{name}.png")
    return True

def main():
    if "--list" in sys.argv:
        for c in POSES:
            print(f"{c}:  " + ", ".join(list(IDLES) + list(POSES[c])))
        return
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    args = sys.argv[1:]
    only = None
    out_dir = OUT_DEFAULT
    if "--only" in args:
        i = args.index("--only"); only = set(args[i+1].split(",")); del args[i:i+2]
    if "--out" in args:
        i = args.index("--out"); out_dir = args[i+1]; del args[i:i+2]
    chars = args or list(POSES)
    ok, fail = [], []
    for char in chars:
        if char not in POSES:
            print(f"skip unknown character: {char}"); continue
        for name, frag in jobs_for(char).items():
            if only and name not in only: continue
            good = generate_one(char, name, frag, key, out_dir)
            (ok if good else fail).append(f"{char}/{name}")
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("Failed:\n  " + "\n  ".join(fail))

if __name__ == "__main__":
    main()
