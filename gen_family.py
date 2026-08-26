#!/usr/bin/env python3
"""
Episode-1 family figures (OpenAI gpt-image-2) — same idiom as gen_suitors.py.

Generates the two missing cast members for "A Caller at the House":
  mrs_frost  — Arabella's ambitious mother
  mr_frost   — Arabella's scholar father

Runs on YOUR machine. Reads the key from OPENAI_API_KEY (never written to file).
Two fixed style-reference images are attached via the images EDITS endpoint so
every figure matches the existing cast concept-sheet rendering.

Prompt = PARA1 (fixed style) + PARA2 (per-character) + PARA3 (fixed negatives).

USAGE  (run from repo root …/roles-ai)
  export OPENAI_API_KEY=sk-...
  python3 gen_family.py                 # both
  python3 gen_family.py mr_frost        # one
  python3 gen_family.py --list

Output: <id>/appearances/pride.png (so the episode picks it up) + _gen/out/<id>.png
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
SIZE  = "1440x2560"    # 9:16 portrait at 2K

WORLD  = "worlds/pride-and-prejudice"
CHARS  = f"{WORLD}/characters"
REFS   = [f"{CHARS}/_gen/refs/ref1.png", f"{CHARS}/_gen/refs/ref2.png"]
OUT_DEFAULT = f"{CHARS}/_gen/out"

PARA1 = ("use the art style from the two reference images. full-body character "
    "costume-design sheet, single standing figure, centered, plain white studio "
    "background, painterly oil-and-gouache, confident visible brushstrokes, soft "
    "natural modeling, elegant Regency period-drama costume illustration, refined, "
    "slightly loose; match the rendering of the existing cast concept sheets")

PARA3 = ("Things that are not in the picture; text, letters, watermark, signature, "
    "extra limbs, distorted hands, distorted face, cluttered background, modern "
    "clothing, photorealistic, multiple figures, cropped body")

CHARACTERS = {
    "mrs_frost": ("a handsome ambitious Regency matron of about forty-eight, sharp bright eyes and "
        "greying hair dressed a touch too grandly, in a fine but slightly overdone day gown with "
        "too many ribbons and a lace cap, an eager calculating smile — a mother determined to marry "
        "her daughter well"),
    "mr_frost": ("an elderly Regency gentleman of about sixty, thin and slightly stooped with "
        "thinning grey hair and small spectacles, in a plain old-fashioned dark coat a little behind "
        "the fashion, a book held under one arm, a kind but abstracted scholar's face — a father who "
        "loved his daughter's mind and left her nothing to live on"),
    "the_maid": ("a young Regency housemaid of about seventeen, small and slight with hair tucked "
        "under a plain white cap, in a modest grey servant's dress with a white apron, holding a tea "
        "tray a little nervously, a timid downcast face — a frightened girl hoping not to be noticed"),
}

def build_prompt(cid):
    return PARA1 + "\n\n" + CHARACTERS[cid] + "\n\n" + PARA3

def multipart(fields, files):
    boundary = "----family" + base64.urlsafe_b64encode(os.urandom(9)).decode()
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

def generate(cid, key, out_dir):
    prompt = build_prompt(cid)
    refs = [p for p in REFS if os.path.exists(p)]
    if refs:
        fields = {"model": MODEL, "prompt": prompt, "size": SIZE}
        files = [("image[]", p) for p in refs]
        body, ctype = multipart(fields, files)
        req = urllib.request.Request(f"{API}/edits", data=body,
            headers={"Authorization": f"Bearer {key}", "Content-Type": ctype}, method="POST")
    else:
        payload = json.dumps({"model": MODEL, "prompt": prompt, "size": SIZE}).encode()
        req = urllib.request.Request(f"{API}/generations", data=payload,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")

    print(f"[{cid}] {SIZE}  refs={len(refs)}  → requesting… (up to {TIMEOUT}s)")
    out = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
                out = json.loads(resp.read().decode())
            break
        except urllib.error.HTTPError as e:
            print(f"[{cid}] HTTP {e.code}: {e.read().decode()[:300]}")
            if e.code in (429,500,502,503,504) and attempt < RETRIES: time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{cid}] timed out ({attempt}/{RETRIES})");  time.sleep(3)
            if attempt < RETRIES: continue
            return False
        except Exception as e:
            print(f"[{cid}] error: {e}"); return False
    if out is None: return False

    png = base64.b64decode(out["data"][0]["b64_json"])
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, cid + ".png"), "wb") as f: f.write(png)
    dd = os.path.join(CHARS, cid, "appearances"); os.makedirs(dd, exist_ok=True)
    with open(os.path.join(dd, "pride.png"), "wb") as f: f.write(png)
    print(f"[{cid}] saved → {cid}/appearances/pride.png")
    return True

def main():
    if "--list" in sys.argv: print("\n".join(CHARACTERS)); return
    key = os.environ.get("OPENAI_API_KEY")
    if not key: sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    args = list(sys.argv[1:]); out_dir = OUT_DEFAULT
    if "--out" in args: i = args.index("--out"); out_dir = args[i+1]; del args[i:i+2]
    ids = args or list(CHARACTERS)
    for cid in ids:
        if cid not in CHARACTERS: print("skip unknown:", cid); continue
        generate(cid, key, out_dir)
    print("\nDone. If the figures come on a white background, run the same white-key "
          "cleanup we used for the suitors to make them transparent.")

if __name__ == "__main__":
    main()
