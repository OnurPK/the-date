#!/usr/bin/env python3
"""
Pride & Prejudice — EXPLORE backdrops (populated, single baked image).

Same engine as gen_scenes.py / gen_shorts.py (OpenAI gpt-image-2, reference-guided
edits). Runs on YOUR machine (this Cowork sandbox blocks api.openai.com).
Reads OPENAI_API_KEY from the env; never stored here.

WHY BAKED (not overlaid sprites):
  Cut-out sprites floated over a room read as "pasted on" — no contact shadow,
  wrong candlelight. The London model bakes everyone INTO one coherent render,
  correct shadows + light. This does that: the EMPTY room is attached as a
  strict setting reference; the guests are painted in, grounded and lit to match.

USAGE
  export OPENAI_API_KEY=sk-...
  cd .../roles-ai
  python gen_explore.py supper            # the supper table (10 guests)
  python gen_explore.py --all

Output → worlds/pride-and-prejudice/locations/netherfield-ball/explore/<id>_populated.png
(the original empty backdrop is kept untouched).

NOTE — this is the HARDEST render we do: 10 distinct seated guests in one image.
Faces won't be pixel-perfect to each cast sheet, and that's fine: in free-explore
each guest's identity is confirmed by their name + portrait when you tap them.
Re-run until the composition/costumes read right; iterate on the prompt freely.
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
API = "https://api.openai.com/v1/images"
WORLD = "worlds/pride-and-prejudice"
LOC   = f"{WORLD}/locations/netherfield-ball"
OUT_DEFAULT = f"{LOC}/explore"

LANDSCAPE = "1536x1024"   # matches the wide room backdrops

# character id -> sprite reference (same convention as gen_scenes.py). We attach
# only a few STORY-CRITICAL faces as refs — attaching all ten would overwhelm the
# edit and smear identities. The rest are pinned by their canonical costume in the
# prompt (costume map is from ASSETS.md, confirmed 2026-07-15).
CHARS = {c: f"{WORLD}/characters/{c}/appearances/pride.png" for c in [
    "mrs_bennet", "charlotte_lucas", "mr_darcy"]}

# id: (size, room-ref file, [hero character refs], prompt-subject)
EXPLORE = {
 "supper": (LANDSCAPE, f"{OUT_DEFAULT}/supper.png",
   ["mrs_bennet", "charlotte_lucas", "mr_darcy"],
   "Populate this candlelit Regency dining room with a seated evening supper party of ten guests "
   "around the long white-clothed table, every figure grounded with correct contact shadows and lit "
   "only by the candelabra and sconces — warm painterly realism, night. Keep the room, table, silver, "
   "curtains, doorway and ceiling EXACTLY as in the reference. "
   "Seat, from the near foreground end toward the far end (the very near seat left empty, for the viewer): "
   "(1) a plain, composed young woman in a sage-green empire gown leaning in confidentially toward the viewer's empty place; "
   "(2) across from her, a proud austere gentleman in a black tailcoat and ivory waistcoat, dark hair, cold and still, listening; "
   "(3) beside him, an elegant woman in a bold red gown with an emerald necklace and black gloves, attentive to him; "
   "(4) mid-table, a showy older woman in a mustard-gold gown with plum trim and a feathered turban, a fan in hand, mouth open mid-declaration, holding court; "
   "(5) next to her, a giggling young woman in a purple off-shoulder gown, auburn hair dressed with flowers, leaning to whisper; "
   "(6) a pompous clergyman in clerical black with white bands, mid-sentence; "
   "(7) a gentle blonde woman in a blush-pink gown; "
   "(8) toward the head of the table, a warm smiling young host in a colourful cravat and cream lapels; "
   "(9) an older bearded gentleman in black tails and a cream waistcoat; "
   "(10) mid-table, a brown-haired young woman in a dusty-rose gown with a wry, knowing expression. "
   "A few more indistinct guests and a footman blur softly in the background near the doorway. "
   "No text, no lettering, no modern elements."),

 # ballroom populated version comes next (Darcy at the windows, Bingley centre,
 # officers+Wickham at the left wall, Caroline at the pianoforte, soft dancing crowd).
}


def refs_for(room_file, hero_ids, use_refs):
    files = []
    if room_file and os.path.exists(room_file):
        files.append(room_file)            # room ref FIRST — the strict setting anchor
    if use_refs:
        for c in hero_ids:
            p = CHARS.get(c)
            if p and os.path.exists(p):
                files.append(p)
    return files


def multipart(fields, files):
    boundary = "----pandpexplore" + base64.urlsafe_b64encode(os.urandom(9)).decode()
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
    size, room, heroes, subject = EXPLORE[scene_id]
    refs = refs_for(room, heroes, use_refs)
    prompt = ("Using the FIRST attached image ONLY as the exact room/setting reference (do not change the "
              "room, its architecture, table, candlelight or props), and any further attached images ONLY "
              "as character-design references (faces, costume, palette) — paint a NEW populated scene: "
              + subject) if refs else subject

    if refs:
        fields = {"model": MODEL, "prompt": prompt, "size": size}
        files = [("image[]", p) for p in refs]
        body, ctype = multipart(fields, files)
        url = f"{API}/edits"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": ctype}
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    else:
        url = f"{API}/generations"
        payload = json.dumps({"model": MODEL, "prompt": prompt, "size": size}).encode()
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    print(f"[{scene_id}] {size}  refs={len(refs)} (room + {max(0,len(refs)-1)} faces)  → requesting… (up to {TIMEOUT}s)")
    out = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
                out = json.loads(resp.read().decode())
            break
        except urllib.error.HTTPError as e:
            print(f"[{scene_id}] HTTP {e.code}: {e.read().decode()[:400]}")
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES:
                print(f"[{scene_id}] retry {attempt} in 6s…"); time.sleep(6); continue
            return False
        except (TimeoutError, socket.timeout):
            print(f"[{scene_id}] timed out ({attempt}/{RETRIES}).")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except urllib.error.URLError as e:
            msg = str(getattr(e, "reason", e))
            if "CERTIFICATE_VERIFY_FAILED" in msg or "SSL" in msg:
                print(f"[{scene_id}] TLS cert error. Fix:  pip3 install certifi"); return False
            print(f"[{scene_id}] network error ({attempt}/{RETRIES}): {msg}")
            if attempt < RETRIES: time.sleep(3); continue
            return False
        except Exception as e:
            print(f"[{scene_id}] unexpected: {e}"); return False
    if out is None:
        return False

    b64 = out["data"][0]["b64_json"]
    os.makedirs(out_dir, exist_ok=True)
    dest = os.path.join(out_dir, scene_id + "_populated.png")
    with open(dest, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"[{scene_id}] saved → {dest}")
    return True


def main():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=sk-...")
    use_refs = "--no-refs" not in sys.argv
    args = [a for a in sys.argv[1:] if a not in ("--all", "--no-refs")]
    out_dir = OUT_DEFAULT
    if "--out" in args:
        i = args.index("--out"); out_dir = args[i+1]; del args[i:i+2]
    ids = list(EXPLORE) if "--all" in sys.argv else (args or ["supper"])
    ok, fail = [], []
    for sid in ids:
        if sid not in EXPLORE:
            print(f"skip unknown id: {sid}"); continue
        good = False
        try:
            good = generate(sid, key, out_dir, use_refs)
        except Exception as e:
            print(f"[{sid}] batch error: {e}")
        (ok if good else fail).append(sid)
    print(f"\nDONE — {len(ok)} ok, {len(fail)} failed.")
    if fail:
        print("Re-run:  python3 gen_explore.py " + " ".join(fail))


if __name__ == "__main__":
    main()
