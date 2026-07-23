# Netherfield Ball — BACKGROUND prompts (reference-driven, 1:1)

We already have 3 EXPLORE screens (wide, empty):
`locations/netherfield-ball/explore/`  → `ballroom.png` · `supper.png` · `terrace.png`

Generate each background below at **1:1**, feeding the named explore image as the
**reference image** (IP-adapter / style-ref, or img2img on the relevant crop) so palette,
architecture and brushwork match exactly. The reference carries the style — the prompt just
reframes the view. Only the 5 backgrounds + cover the PLAYABLE ROUTE needs are here.

**Universal rules (every one):**
- `--ar 1:1`, centered, ~15% empty margin on all edges for **parallax** travel.
- Keep the **lower third / foreground open** — the character sprites composite on top.
- Painterly oil-and-gouache, warm candlelit chiaroscuro (matches the reference).
- NEGATIVE: `text, watermark, signature, modern objects, electric light, lens flare, frame,
  photorealistic, distorted faces, extra limbs, cluttered foreground`.

═══════════════════════════════════════════════════════════════════════

### 1 · `officers-corner.jpg`   → location/backgrounds/   (ref: **ballroom.png**)
Reframe the SAME ballroom, moved into a corner by a wall: a scatter of militia red-coats as
soft ambient background figures, a gilt wall-sconce, dark panelling, the crowded floor glinting
beyond. Foreground kept open for a charming officer + the heroine to stand and talk.
`--ar 1:1` · ref ballroom.png.

### 2 · `alcove-shadow.jpg`   → location/backgrounds/   (ref: **ballroom.png**)
Reframe the SAME ballroom into a shadowed window alcove at its edge: tall night-blue Georgian
windows, deep teal drapery half-drawn, one guttering sconce, the bright noisy ballroom blurred
warm beyond the alcove mouth. Darker and hushed than the rest of the ball; foreground open for
two men in low conference + an eavesdropper at the edge.
`--ar 1:1` · ref ballroom.png.

### 3 · `thinning-ball.jpg`   → location/backgrounds/   (ref: **ballroom.png**)
The SAME ballroom at the very end of the night: mostly empty, candles guttering low in the
chandeliers, footmen snuffing them two by two, chairs pushed back, cool grey dawn-blue creeping
into the windows against the last amber candlelight. Melancholy, spacious, winding-down.
`--ar 1:1` · ref ballroom.png.

### 4 · `the-dance-set.jpg`   → episode/cutscenes/   (ref: **ballroom.png**)
A close, intimate view of the ballroom dance floor — the SAME room, moved right in: other
dancing couples soft and out of focus in the warm background, chandeliers blazing overhead,
candlelight raking across polished parquet, a charged hush. **Centre-foreground kept open** for
two figures (Arabella + Darcy) to stand up together.
`--ar 1:1` · ref ballroom.png.
> (If you want the couple baked in instead of sprite-over: add "two figures dancing close, a
>  proud dark-haired gentleman in black and a young woman in a deep-navy gown, eyes locked,
>  mid-figure of the dance" and drop "foreground open".)

### 5 · `carriage-night.jpg`   → episode/cutscenes/   (ref: **terrace.png** for the night palette)
The dark cold road home from the ball at night: hedgerows and bare trees, a rutted moonlit
lane, the warm lit windows of a great Georgian house (Netherfield) shrinking small in the
distance behind, deep night-blue sky, a single carriage lamp casting warm amber against the
cold. Lonely, charged, cinematic. House-lights small and off-centre so parallax can drift.
`--ar 1:1` · ref terrace.png (borrow its warm-interior-vs-cool-night contrast).

### 6 · `cover.jpg`   → episode root   (ref: **ballroom.png**)
A signature hero shot of the blazing Netherfield ballroom — chandeliers ablaze, gilt mirrors,
painted ceiling, a suggestion of a turning dance, warm and inviting; postcard-strong.
`--ar 1:1` · ref ballroom.png.

═══════════════════════════════════════════════════════════════════════
## Placement (once generated)
| file                  | goes to |
|-----------------------|---------|
| officers-corner.jpg   | `locations/netherfield-ball/backgrounds/` |
| alcove-shadow.jpg     | `locations/netherfield-ball/backgrounds/` |
| thinning-ball.jpg     | `locations/netherfield-ball/backgrounds/` |
| the-dance-set.jpg     | `episodes/the-newcomer/the-netherfield-ball/cutscenes/` |
| carriage-night.jpg    | `episodes/the-newcomer/the-netherfield-ball/cutscenes/` |
| cover.jpg             | `episodes/the-newcomer/the-netherfield-ball/` |

> These 5 + cover are ALL the playable single route needs (pianoforte / dance-with-another are
> not in this route). The 3 explores you already have cover the hub + supper.
