#!/usr/bin/env python3
"""Map tile pipeline — cut a location out of the map with an organic mask and build the alpha clip.

  cut:    python3 map_tile.py cut  --map map.jpg --x 2300 --y 560 --w 560 --h 400 --out _mockups/map_tiles/<loc>
          → tile_rect.jpg, mask.png (soft organic), painted_alpha.png (web), painted_green.png (Seedance last frame),
            edit_ref.png + edit_mask.png (for the gpt-image inpaint that removes the building; region = --bx --by --bw --bh)
  empty:  python3 map_tile.py empty --out <dir>            (after the inpaint result is saved as empty_raw.png)
          → empty.png, empty_alpha.png, empty_green.png (Seedance first frame)
  video:  python3 map_tile.py video --out <dir> --clip build.mp4
          → build.webm (VP9 alpha via alphamerge with the eroded mask; no chromakey)
"""
import argparse, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

GREEN = (0, 177, 64)
ap = argparse.ArgumentParser(); ap.add_argument('cmd', choices=['cut', 'empty', 'video'])
ap.add_argument('--map'); ap.add_argument('--x', type=int); ap.add_argument('--y', type=int); ap.add_argument('--w', type=int, default=560); ap.add_argument('--h', type=int, default=400)
ap.add_argument('--bx', type=float, default=.14); ap.add_argument('--by', type=float, default=.32); ap.add_argument('--bw', type=float, default=.66); ap.add_argument('--bh', type=float, default=.6)
ap.add_argument('--out', required=True); ap.add_argument('--clip'); ap.add_argument('--seed', type=int, default=3)
a = ap.parse_args(); O = a.out.rstrip('/')

def organic_mask(w, h, seed):
    random.seed(seed); m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m); cx, cy = w / 2, h / 2; pts = []
    for i in range(48):
        t = 2 * math.pi * i / 48; r = 0.92 + 0.10 * math.sin(3 * t + 1.2) + 0.06 * math.sin(7 * t)
        pts.append((cx + math.cos(t) * (w / 2 - 12) * r, cy + math.sin(t) * (h / 2 - 12) * r))
    d.polygon(pts, fill=255); return m.filter(ImageFilter.GaussianBlur(6))

def on_green(im, mask):
    g = Image.new('RGB', im.size, GREEN); return Image.composite(im.convert('RGB'), g, mask)
def with_alpha(im, mask):
    a2 = im.convert('RGBA'); a2.putalpha(mask); return a2

if a.cmd == 'cut':
    import os; os.makedirs(O, exist_ok=True)
    im = Image.open(a.map).convert('RGB'); tile = im.crop((a.x, a.y, a.x + a.w, a.y + a.h)); tile.save(f'{O}/tile_rect.jpg', quality=94)
    mask = organic_mask(a.w, a.h, a.seed); mask.save(f'{O}/mask.png')
    on_green(tile, mask).save(f'{O}/painted_green.png'); with_alpha(tile, mask).save(f'{O}/painted_alpha.png')
    # gpt-image edit reference at 3:2 (1536x1024): pad the tile to 1.5 aspect by mirroring edges, upscale
    tw = int(a.h * 1.5); pad = Image.new('RGB', (tw, a.h)); off = (tw - a.w) // 2; pad.paste(tile, (off, 0))
    pad.paste(tile.crop((0, 0, off, a.h)), (0, 0)); pad.paste(tile.crop((a.w - (tw - a.w - off), 0, a.w, a.h)), (off + a.w, 0))
    pad.resize((1536, 1024), Image.LANCZOS).save(f'{O}/edit_ref.png')
    m = Image.new('L', (1536, 1024), 255); d = ImageDraw.Draw(m); s = 1536 / tw
    d.ellipse(((a.bx * a.w + off) * s, a.by * a.h * s, ((a.bx + a.bw) * a.w + off) * s, (a.by + a.bh) * a.h * s), fill=0)
    m = m.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v > 128 else 0)
    rgba = Image.new('RGBA', (1536, 1024), (0, 0, 0, 255)); rgba.putalpha(m); rgba.save(f'{O}/edit_mask.png')
    print('cut ok →', O, '| inpaint: gen-asset {model:"gpt-image-1", size:"1536x1024", refPaths:[edit_ref.png], maskPath: edit_mask.png, relPath: empty_raw.png}')

elif a.cmd == 'empty':
    mask = Image.open(f'{O}/mask.png').convert('L'); w, h = mask.size; t = Image.open(f'{O}/tile_rect.jpg').convert('RGB')
    tw = int(h * 1.5); off = (tw - w) // 2
    raw = Image.open(f'{O}/empty_raw.png').convert('RGB').resize((tw, h), Image.LANCZOS).crop((off, 0, off + w, h))
    em = Image.open(f'{O}/edit_mask.png').split()[3].resize((tw, h), Image.LANCZOS).crop((off, 0, off + w, h))
    inpaint = Image.eval(em, lambda v: 255 - v).filter(ImageFilter.GaussianBlur(4))
    empty = Image.composite(raw, t, inpaint); empty.save(f'{O}/empty.png')
    on_green(empty, mask).save(f'{O}/empty_green.png'); with_alpha(empty, mask).save(f'{O}/empty_alpha.png'); print('empty ok')

elif a.cmd == 'video':
    mask = Image.open(f'{O}/mask.png').convert('L')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', a.clip], capture_output=True, text=True).stdout.strip().split(',')
    cw, ch = int(probe[0]), int(probe[1])
    hard = mask.point(lambda v: 255 if v > 140 else 0).filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(3))
    hard.save(f'{O}/mask_tight.png'); hard.resize((cw, ch), Image.LANCZOS).save(f'{O}/mask_video.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.clip, '-i', f'{O}/mask_video.png', '-filter_complex',
                    '[0:v]format=rgba[v];[1:v]format=gray[m];[v][m]alphamerge,format=yuva420p[out]', '-map', '[out]',
                    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '26', '-auto-alt-ref', '0', '-an', f'{O}/build.webm'], check=True)
    print('video ok → build.webm (Safari twin on the Mac: ffmpeg -i clip -i mask_video.png -filter_complex "…alphamerge" -c:v hevc_videotoolbox -alpha_quality 0.9 -tag:v hvc1 build.mov)')
