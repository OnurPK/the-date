#!/usr/bin/env python3
"""
Generate the 8 new suitor figures with OpenAI (gpt-image-2, 9:16 @ 2K), matching the
existing cast concept-sheet art via two style-reference images.

Prompt = PARA1 (fixed style) + PARA2 (per-character) + PARA3 (fixed negatives).
The two reference images are passed to the model so it copies their rendering.

USAGE
  export OPENAI_API_KEY=sk-...
  pip install --upgrade openai
  cd worlds/pride-and-prejudice/characters/_gen

  python generate_suitors.py                # generate ALL 8
  python generate_suitors.py lord_ravenscar # generate one
  python generate_suitors.py mr_fenwick mr_quill   # generate a subset
  python generate_suitors.py --list         # list ids

Output: ../<id>/appearances/pride.png   (so the suitors DB picks it up)
Also keeps a copy in ./out/<id>.png for quick review.
"""

import os, sys, base64, time

# ---------------------------------------------------------------- paths
HERE   = os.path.dirname(os.path.abspath(__file__))
CHARS  = os.path.abspath(os.path.join(HERE, ".."))          # .../characters
REF1   = os.path.join(HERE, "refs", "ref1.png")
REF2   = os.path.join(HERE, "refs", "ref2.png")
OUTDIR = os.path.join(HERE, "out")

SIZE  = "1440x2560"   # 9:16 portrait at 2K (both divisible by 16)
MODEL = "gpt-image-2"

# ---------------------------------------------------------------- prompt parts
# Paragraph 1 — FIXED (style). The two reference images are also sent to the API.
PARA1 = (
    "use the art style from the two reference images. full-body character "
    "costume-design sheet, single standing figure, centered, plain white studio "
    "background, painterly oil-and-gouache, confident visible brushstrokes, soft "
    "natural modeling, elegant Regency period-drama costume illustration, refined, "
    "slightly loose; match the rendering of the existing cast concept sheets"
)

# Paragraph 3 — FIXED (negatives).
PARA3 = (
    "Things that are not in the picture; text, letters, watermark, signature, "
    "extra limbs, distorted hands, distorted face, cluttered background, modern "
    "clothing, photorealistic, multiple figures, cropped body"
)

# Paragraph 2 — per character (varies).
SUITORS = {
    # ---- wealthy (5) ----
    "lord_ravenscar": (
        "a darkly handsome Regency nobleman of about thirty, tall and lean with "
        "black hair and a faint scar, in a superbly cut black tailcoat over a "
        "deep-wine silk waistcoat, cravat loosened, one gloved hand resting on a "
        "slim cane, a cool magnetic half-smile — a viscount whose charm is a "
        "loaded pistol"
    ),
    "sir_ashbourne": (
        "a distinguished Regency gentleman of about forty-five, solidly built with "
        "chestnut hair greying at the temples, in a well-cut bottle-green coat and "
        "buff breeches, standing calm and upright, a warm steady gaze — a kind "
        "widower baronet, the safe and sensible match"
    ),
    "capt_vane": (
        "a rugged Regency naval captain of about thirty-two, sun-bronzed with "
        "tousled dark-blond hair, in a dark-blue Royal Navy dress uniform with "
        "gold epaulettes and brass buttons, an easy weathered grin, arms loosely "
        "crossed — a self-made man grown rich on the sea and unashamed of it"
    ),
    "mr_devereux": (
        "an elegant Regency emigre gentleman of about thirty-five, olive-skinned "
        "with dark wavy hair and expressive eyes, in a plum-and-silver "
        "French-cut coat with lace cuffs and a signet ring, poised and theatrical, "
        "a knowing half-smile — an exiled French aristocrat, all charm and mystery"
    ),
    "mr_hale": (
        "a robust Regency man of new wealth, about thirty, close-cropped auburn "
        "hair and strong features, in a slightly-too-fine dark-plum coat with a "
        "heavy gold watch-chain, an assured almost-defiant stance — a "
        "manufacturer's heir with more ready money than manners"
    ),
    # ---- poor (3) ----
    "mr_fenwick": (
        "a gentle Regency young man of modest means, about twenty-six, soft brown "
        "hair and warm hazel eyes, in a plain neat dark coat a little worn at the "
        "cuffs, no jewels, a shy tender smile — a curate's son and childhood "
        "sweetheart with nothing to offer but a whole heart"
    ),
    "ens_pryce": (
        "a fresh-faced Regency militia ensign of about twenty-two, neat sandy hair "
        "and bright earnest eyes, in a scarlet regimental coat that is plainly his "
        "one fine thing, standing straight-backed and eager — a poor young officer "
        "full of honour and empty of fortune"
    ),
    "mr_quill": (
        "a lean romantic Regency poet of about twenty-seven, tousled dark curls "
        "and pale intense features with ink-stained fingers, in a threadbare but "
        "artful coat and a loosely-tied cravat, holding a small book, a faraway "
        "burning gaze — a penniless gentleman who traded his inheritance for verse"
    ),
}

def build_prompt(para2: str) -> str:
    return PARA1 + "\n\n" + para2 + "\n\n" + PARA3

def main():
    args = [a for a in sys.argv[1:]]
    if "--list" in args:
        print("\n".join(SUITORS.keys())); return

    ids = [a for a in args if not a.startswith("-")] or list(SUITORS.keys())
    bad = [i for i in ids if i not in SUITORS]
    if bad:
        print("Unknown id(s):", ", ".join(bad)); print("Try --list"); sys.exit(1)

    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: set OPENAI_API_KEY first."); sys.exit(1)
    for p in (REF1, REF2):
        if not os.path.exists(p):
            print("ERROR: missing reference image:", p); sys.exit(1)

    from openai import OpenAI
    client = OpenAI()
    os.makedirs(OUTDIR, exist_ok=True)

    for i, cid in enumerate(ids, 1):
        prompt = build_prompt(SUITORS[cid])
        print(f"[{i}/{len(ids)}] {cid} … generating", flush=True)
        try:
            with open(REF1, "rb") as f1, open(REF2, "rb") as f2:
                resp = client.images.edit(
                    model=MODEL,
                    image=[f1, f2],
                    prompt=prompt,
                    size=SIZE,
                )
            b64 = resp.data[0].b64_json
            png = base64.b64decode(b64)
        except Exception as e:
            print(f"    ! failed: {e}")
            continue

        # 1) review copy
        with open(os.path.join(OUTDIR, cid + ".png"), "wb") as o:
            o.write(png)
        # 2) engine location the suitors DB reads
        dest_dir = os.path.join(CHARS, cid, "appearances")
        os.makedirs(dest_dir, exist_ok=True)
        with open(os.path.join(dest_dir, "pride.png"), "wb") as o:
            o.write(png)
        print(f"    saved -> out/{cid}.png  and  {cid}/appearances/pride.png")
        time.sleep(1)

    print("\nDone. Review images in _gen/out/. Re-run any id to regenerate.")

if __name__ == "__main__":
    main()
