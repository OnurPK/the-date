#!/usr/bin/env python3
"""Green-screen pose clip → 16 (or N) webp frames in the sprite's framing.

usage:
  python3 pose_frames.py --sprite characters/x/appearances/pride.png --green _mockups/x_poses/x_idle_green.png \
      --clip in.mp4 --out characters/x/poses/beam --mode hold --t1 2.3          # 0→peak, holds last frame
  python3 pose_frames.py ... --mode loop --t1 4.0                               # 0→end exclusive, loops
  python3 pose_frames.py ... --mode oneshot --t1 4.0 --n 24                     # full gesture, 24 frames

The green start frame was made by compositing the sprite on #00B140 (1080×1920, figure 86% tall, feet at 93%).
The crop maps that green frame back to the sprite's own framing so the CSS that positions pride.png needs no change.
No despill filter (it tints ivory/grass); the rim is fixed in numpy instead.
"""
import argparse, os, subprocess, glob, tempfile
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--sprite', required=True); ap.add_argument('--green', required=True)
ap.add_argument('--clip', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--mode', choices=['hold', 'loop', 'oneshot'], default='hold')
ap.add_argument('--t0', type=float, default=0.0); ap.add_argument('--t1', type=float, required=True)
ap.add_argument('--n', type=int, default=16); ap.add_argument('--key', default='0x00B140:0.13:0.06')
a = ap.parse_args()

def bbox(im):
    arr = np.array(im.convert('RGBA'))[:, :, 3]; ys, xs = np.where(arr > 10)
    return xs.min(), ys.min(), xs.max(), ys.max()

sp = Image.open(a.sprite); sw, sh = sp.size; sx0, sy0, sx1, sy1 = bbox(sp)
g = Image.open(a.green).convert('RGB'); gw, gh = g.size
ga = np.array(g).astype(int); green = (abs(ga[:, :, 0]) < 40) & (abs(ga[:, :, 1] - 177) < 40) & (abs(ga[:, :, 2] - 64) < 40)
ys, xs = np.where(~green); gx0, gy0, gx1, gy1 = xs.min(), ys.min(), xs.max(), ys.max()
# sprite framing → green-frame coordinates: the figure box maps onto the figure box
k = (gy1 - gy0) / (sy1 - sy0)
crop_x, crop_y = gx0 - sx0 * k, gy0 - sy0 * k
crop_w, crop_h = sw * k, sh * k
# clip may be a different size than the green frame: scale factors
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', a.clip], capture_output=True, text=True).stdout.strip().split(',')
cw, ch = int(probe[0]), int(probe[1]); fx, fy = cw / gw, ch / gh
cx, cy, cwid, chei = int(crop_x * fx), int(crop_y * fy), int(crop_w * fx), int(crop_h * fy)
out_w = 640; out_h = int(round(out_w * sh / sw))

dur = a.t1 - a.t0
if a.mode == 'loop':
    fps = a.n / dur; t = dur - 0.01          # N frames over [t0, t1) — last frame ≠ first
else:
    fps = (a.n - 1) / dur; t = dur + 0.08    # N frames over [t0, t1] inclusive — last frame = the peak/end
tmp = tempfile.mkdtemp()
vf = f"chromakey={a.key},crop={cwid}:{chei}:{cx}:{cy},scale={out_w}:{out_h}:flags=lanczos,fps={fps:.6f}"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a.t0:.3f}', '-i', a.clip, '-t', f'{t:.3f}', '-vf', vf, '-pix_fmt', 'rgba', f'{tmp}/f%02d.png'], check=True)
fs = sorted(glob.glob(f'{tmp}/f*.png'))[:a.n]
os.makedirs(a.out, exist_ok=True)
for i, f in enumerate(fs):
    arr = np.array(Image.open(f).convert('RGBA')).astype(np.int16)
    al = arr[:, :, 3]; edge = (al > 0) & (al < 235)
    rb = np.maximum(arr[:, :, 0], arr[:, :, 2]); gch = arr[:, :, 1]; over = edge & (gch > rb); arr[:, :, 1][over] = rb[over]
    arr[:, :, 3][al < 28] = 0
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save(f'{a.out}/f{i:02d}.webp', quality=90, method=4)
print(f'{a.out}: {len(fs)} frames ({a.mode}, {a.t0}-{a.t1}s), crop {cwid}x{chei}+{cx}+{cy} → {out_w}x{out_h}')
