#!/usr/bin/env python3
"""
Suitor figure generator (OpenAI gpt-image-2) — same idiom as gen_scenes.py.

Runs on YOUR machine. Reads the key from OPENAI_API_KEY (never written to file).
Two fixed style-reference images are attached via the images EDITS endpoint so
every figure matches the existing cast concept-sheet rendering.

Prompt = PARA1 (fixed style) + PARA2 (per-character) + PARA3 (fixed negatives).

USAGE  (run from repo root …/roles-ai)
  export OPENAI_API_KEY=sk-...
  python3 gen_suitors.py                         # ALL 8
  python3 gen_suitors.py lord_ravenscar          # one
  python3 gen_suitors.py mr_fenwick mr_quill     # a few
  python3 gen_suitors.py --list                  # list ids
  python3 gen_suitors.py --out some/dir  <ids>   # override review dir
  python3 gen_suitors.py --no-refs  <ids>        # skip style refs (text-only)

Output: writes <id>.png into the review dir (default worlds/.../characters/_gen/out)
AND copies it to worlds/.../characters/<id>/appearances/pride.png so the suitors
DB picks it up automatically.
"""

import os, sys, base64, json, mimetypes, ssl, time, socket, urllib.request, urllib.error

TIMEOUT = 300          # seconds per request (2K edits are slow)
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
SIZE  = "1440x2560"    # 9:16 portrait at 2K (both divisible by 16)

WORLD  = "worlds/pride-and-prejudice"
CHARS  = f"{WORLD}/characters"
REFS   = [f"{CHARS}/_gen/refs/ref1.png", f"{CHARS}/_gen/refs/ref2.png"]
OUT_DEFAULT = f"{CHARS}/_gen/out"

# ---- prompt: paragraphs 1 & 3 fixed, 2 per character -----------------------
PARA1 = ("use the art style from the two reference images. full-body character "
    "costume-design sheet, single standing figure, centered, plain white studio "
    "background, painterly oil-and-gouache, confident visible brushstrokes, soft "
    "natural modeling, elegant Regency period-drama costume illustration, refined, "
    "slightly loose; match the rendering of the existing cast concept sheets")

PARA3 = ("Things that are not in the picture; text, letters, watermark, signature, "
    "extra limbs, distorted hands, distorted face, cluttered background, modern "
    "clothing, photorealistic, multiple figures, cropped body")

SUITORS = {
    # ---- wealthy (5) ----
    "lord_ravenscar": ("a darkly handsome Regency nobleman of about thirty, tall and lean with "
        "black hair and a faint scar, in a superbly cut black tailcoat over a deep-wine silk "
        "waistcoat, cravat loosened, one gloved hand resting on a slim cane, a cool magnetic "
        "half-smile — a viscount whose charm is a loaded pistol"),
    "sir_ashbourne": ("a distinguished Regency gentleman of about forty-five, solidly built with "
        "chestnut hair greying at the temples, in a well-cut bottle-green coat and buff breeches, "
        "standing calm and upright, a warm steady gaze — a kind widower baronet, the safe and "
        "sensible match"),
    "capt_vane": ("a rugged Regency naval captain of about thirty-two, sun-bronzed with tousled "
        "dark-blond hair, in a dark-blue Royal Navy dress uniform with gold epaulettes and brass "
        "buttons, an easy weathered grin, arms loosely crossed — a self-made man grown rich on the "
        "sea and unashamed of it"),
    "mr_devereux": ("an elegant Regency emigre gentleman of about thirty-five, olive-skinned with "
        "dark wavy hair and expressive eyes, in a plum-and-silver French-cut coat with lace cuffs "
        "and a signet ring, poised and theatrical, a knowing half-smile — an exiled French "
        "aristocrat, all charm and mystery"),
    "mr_hale": ("a robust Regency man of new wealth, about thirty, close-cropped auburn hair and "
        "strong features, in a slightly-too-fine dark-plum coat with a heavy gold watch-chain, an "
        "assured almost-defiant stance — a manufacturer's heir with more ready money than manners"),
    # ---- poor (3) ----
    "mr_fenwick": ("a gentle Regency young man of modest means, about twenty-six, soft brown hair "
        "and warm hazel eyes, in a plain neat dark coat a little worn at the cuffs, no jewels, a "
        "shy tender smile — a curate's son and childhood sweetheart with nothing to offer but a "
        "whole heart"),
    "ens_pryce": ("a fresh-faced Regency militia ensign of about twenty-two, neat sandy hair and "
        "bright earnest eyes, in a scarlet regimental coat that is plainly his one fine thing, "
        "standing straight-backed and eager — a poor young officer full of honour and empty of "
        "fortune"),
    "mr_quill": ("a lean romantic Regency poet of about twenty-seven, tousled dark curls and pale "
        "intense features with ink-stained fingers, in a threadbare but artful coat and a "
        "loosely-tied cravat, holding a small book, a faraway burning gaze — a penniless gentleman "
        "who traded his inheritance for verse"),
}

def build_prompt(cid):
    return PARA1 + "\n\n" + SUITORS[cid] + "\n\n" + PARA3

def multipart(fields, files):
    boundary = "----suitors" + base64.urlsafe_b64encode(os.urandom(9)).decode()
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

def generate(cid, key, out_dir, use_refs):
    prompt = build_prompt(cid)
    refs = [p for p in REFS if os.path.exists(p)] if use_refs else []

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
            msg = e.read().decode()[:400]
            print(f"[{cid}] HTTP {e.code}: {msg}")
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                print(f"[{cid}] retry {attempt}/{RETRIES-1} in 6s…"); time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{cid}] timed out (attempt {attempt}/{RETRIES}).")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except urllib.error.URLError as e:
            m = str(getattr(e, "reason", e))
            if "CERTIFICATE_VERIFY_FAILED" in m or "SSL" in m:
                print(f"[{cid}] TLS cert error. Fix:  pip3 install certifi"); return False
            print(f"[{cid}] network error (attempt {attempt}/{RETRIES}): {m}")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except Exception as e:
            print(f"[{cid}] unexpected error: {e}"); return False
    if out is None:
        return False

    png = base64.b64decode(out["data"][0]["b64_json"])
    os.makedirs(out_dir, exist_ok=True)
    review = os.path.join(out_dir, cid + ".png")
    with open(review, "wb") as f:
        f.write(png)
    dest_dir = os.path.join(CHARS, cid, "appearances")
    os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, "pride.png"), "wb") as f:
        f.write(png)
    print(f"[{cid}] saved → {review}  and  {cid}/appearances/pride.png")
    return True

def main():
    if "--list" in sys.argv:
        print("\n".join(SUITORS)); return
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    args = [a for a in sys.argv[1:] if a not in ("--no-refs",)]
    use_refs = "--no-refs" not in sys.argv
    out_dir = OUT_DEFAULT
    if "--out" in args:
        i = args.index("--out"); out_dir = args[i+1]; del args[i:i+2]
    ids = args or list(SUITORS)
    ok, fail = [], []
    for cid in ids:
        if cid not in SUITORS:
            print(f"skip unknown id: {cid}"); continue
        try:
            good = generate(cid, key, out_dir, use_refs)
        except Exception as e:
            print(f"[{cid}] batch-level error, skipping: {e}"); good = False
        (ok if good else fail).append(cid)
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("Re-run the failed ones:\n  python3 gen_suitors.py " + " ".join(fail))

if __name__ == "__main__":
    main()
