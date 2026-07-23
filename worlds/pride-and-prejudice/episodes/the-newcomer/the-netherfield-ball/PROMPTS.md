# Netherfield Ball — image-gen prompt pack

Shared blocks so every asset reads as one place. Compose each prompt as:
**`[STYLE] + [NETHERFIELD] + <scene> + <composition/aspect> + [NEGATIVE]`**
Explore and background prompts cross-reference by ID (e.g. BG-1 "same room as EX-1, closer").

---

## [STYLE]  (paste into every prompt — matches the character concept sheets)
> loose painterly concept art, oil-and-gouache, confident visible brushstrokes, cinematic
> candlelit chiaroscuro, John Singer Sargent meets period-drama matte painting, rich but
> muted historical palette, warm and atmospheric, hand-painted, NOT photorealistic

## [NETHERFIELD]  (the location bible — keeps every asset the same house)
> Netherfield, a grand Georgian English country house on a blazing ball night; ivory panelled
> walls, gilt-gold ornament, mahogany woodwork, deep teal-green velvet drapery, warm
> beeswax-candle amber light from crystal chandeliers and wall sconces, night-blue windows,
> a painted ceiling fresco; ball-red upholstered chairs as the accent colour; early-19th-c.
> Regency country-house ball

## [NEGATIVE]  (paste into negative field)
> text, letters, signage, watermark, signature, modern objects, electric lighting, lens flare,
> frame, border, photorealistic, distorted faces, extra limbs, cluttered foreground

## Aspect + parallax rules
- **EXPLORE** → `--ar 3:2` wide panoramic. Camera pulled back; furnished + alive with a **soft,
  faceless ambient ball crowd** so it never looks sterile; the interactable ZONES spread legibly
  across the mid-ground with a **clear lit pocket at each** where a named-character SPRITE
  composites (Model B — do NOT bake the named cast in); floor foreground kept open for UI.
- **BACKGROUND** → `--ar 1:1`. Centered composition with **~15% empty margin on all four edges**
  as parallax travel room (nothing critical near an edge). Keep the **lower third simple** so
  character sprites + the dialog box sit cleanly on top. Environment-forward, hero characters
  are separate sprites (do NOT bake Arabella/Darcy in) unless a prompt says otherwise.

═══════════════════════════════════════════════════════════════════════
## EXPLORE  (wide 3:2, empty, hotspot-ready)
═══════════════════════════════════════════════════════════════════════

### EX-1 · `explore/ballroom_hub.jpg`  — the hub (based on your ballroom concept)
`[STYLE] + [NETHERFIELD] +` a wide view down the length of the blazing Netherfield ballroom,
alive with a soft faceless ambient crowd of dancing guests, composed so distinct zones read
clearly for interaction, each with a clear lit pocket for a character sprite: a wall of red-coat
officers' territory at far left, a pianoforte in a pool of candlelight at mid-left, a shadowed
window ALCOVE with tall night-blue windows at centre-right, an open parquet dance floor filling
the middle, an archway to the supper room at right, gilt mirrors reflecting the chandeliers;
polished herringbone parquet catching warm light. `--ar 3:2`, panoramic, camera pulled back,
zones spread across the mid-ground, foreground floor kept clear. `+ [NEGATIVE]`

### EX-2 · `explore/supper_table.jpg`  — the supper room (continuity: adjacent to EX-1)
`[STYLE] + [NETHERFIELD] +` a long white-clothed supper table set with silver, candelabra and
glass, seen wide, in a smaller candlelit dining room off the ballroom (same house palette as EX-1
ballroom), a soft faceless ambient supper crowd; distinct **empty seating pockets** spaced along
the table where named-character sprites will sit/stand; a doorway back to the glowing ballroom at
one end; warmer, more intimate light than the ballroom. `--ar 3:2`, panoramic, hotspot zones
legible, foreground clear. `+ [NEGATIVE]`

### EX-3 · `explore/terrace.jpg`  — night terrace (optional; based on your terrace concept)
`[STYLE] + [NETHERFIELD] +` the stone terrace and balustrade OUTSIDE the ballroom at night,
Corinthian columns, a pair of stone urns with clipped bay trees, tall glowing French doors
spilling warm candlelight onto pale flagstones, guests glimpsed as soft silhouettes through the
lit windows, a crescent moon and cool night-blue sky beyond; **empty foreground**. `--ar 3:2`,
panoramic, warm-interior vs cool-night contrast, floor foreground clear. `+ [NEGATIVE]`

═══════════════════════════════════════════════════════════════════════
## BACKGROUNDS  (1:1, centered, parallax margin, sprite-ready)
═══════════════════════════════════════════════════════════════════════

### BG-1 · `cutscenes/dance_floor.jpg`  — the_dance + the_other_partner (continuity: EX-1, closer)
`[STYLE] + [NETHERFIELD] +` a close, intimate view of the ballroom dance floor — the SAME room
as EX-1 ballroom_hub, moved in — other dancing couples soft and out of focus in the warm
background, chandeliers blazing overhead, candlelight raking across polished parquet, a charged
hush in the air; **centre-foreground left open** for two figures to stand up together. `--ar 1:1`,
centered, 15% margin all edges, lower third simple for sprites. `+ [NEGATIVE]`

### BG-2 · `cutscenes/officers_corner.jpg`  — the_officers_blade (continuity: EX-1 far-left zone)
`[STYLE] + [NETHERFIELD] +` the officers' corner of the ballroom, the SAME room as EX-1 seen up
close: a candlelit wall with a scatter of militia red-coats as soft ambient background figures,
gilt sconce, dark panelling, a glint of the crowded floor beyond; **foreground kept open** for a
charming officer + the heroine to stand and talk. `--ar 1:1`, centered, parallax margin, lower
third simple. `+ [NEGATIVE]`

### BG-3 · `cutscenes/pianoforte.jpg`  — the_rivals_performance (continuity: EX-1 mid-left zone)
`[STYLE] + [NETHERFIELD] +` the pianoforte nook of the ballroom (SAME room as EX-1), a fine
candlelit pianoforte with branched candelabra, a music stand, an empty stool, gilt mirror behind,
warm pool of light; **no player baked in** (rival is a sprite), foreground open. `--ar 1:1`,
centered, parallax margin, lower third simple. `+ [NEGATIVE]`

### BG-4 · `cutscenes/alcove_shadow.jpg`  — the_overheard_crack (continuity: EX-1 centre-right alcove)
`[STYLE] + [NETHERFIELD] +` a shadowed window alcove at the edge of the ballroom (SAME room as
EX-1), tall night-blue Georgian windows, deep teal drapery half-drawn, one guttering wall sconce,
the bright noisy ballroom glimpsed warm and blurred beyond the alcove mouth; hushed, conspiratorial,
darker than the rest of the ball; **foreground open** for two men in low conference + an eavesdropper.
`--ar 1:1`, centered, parallax margin, lower third simple. `+ [NEGATIVE]`

### BG-5 · `cutscenes/thinning_ball.jpg`  — the_thinning_ball coda (continuity: EX-1, emptying)
`[STYLE] + [NETHERFIELD] +` the SAME ballroom as EX-1 at the very end of the night: mostly empty,
candles guttering low in the chandeliers, footmen snuffing them two by two, a few wraps and cloaks,
chairs pushed back, cool grey dawn-blue creeping into the windows against the last amber
candlelight; melancholy, winding-down, spacious. `--ar 1:1`, centered, parallax margin, lower
third simple. `+ [NEGATIVE]`

### BG-6 · `cutscenes/carriage_night.jpg`  — the_last_carriage close (standalone)
`[STYLE] +` the dark cold road home from a country ball at night, seen from just outside a
lamp-lit carriage: hedgerows and bare trees, a rutted moonlit lane, the warm lit windows of a
great Georgian house (Netherfield) shrinking small in the distance behind, deep night-blue sky,
a single carriage lamp casting warm amber against the cold; lonely, charged, cinematic. `--ar 1:1`,
centered, parallax margin, house-lights small and off-centre so parallax can drift. `+ [NEGATIVE]`

### BG-7 · `cover.jpg`  — location cover tile (continuity: EX-1 signature shot)
`[STYLE] + [NETHERFIELD] +` a signature hero shot of the blazing Netherfield ballroom (SAME room
as EX-1), chandeliers ablaze, gilt mirrors, painted ceiling, a suggestion of a turning dance, warm
and inviting; postcard-strong composition. `--ar 1:1`, centered, parallax margin. `+ [NEGATIVE]`

---

## Continuity map (who references whom)
- **EX-1 ballroom_hub** is the master. BG-1/2/3/4/5/7 are all *the same ballroom, closer/emptier*.
- **EX-2 supper_table** & **EX-3 terrace** are adjacent spaces in the same house (same palette).
- **BG-6 carriage_night** is the only exterior/away shot — references Netherfield's lit windows.
- Character sprites (Arabella navy, Elizabeth rose, Caroline red, Lydia purple, Jane blush,
  Sir William tails, Bingley colourful cravat — per ASSETS.md) composite over these; still needed:
  Darcy, Wickham (militia red), Charlotte, Mrs Bennet, Collins.

## Notes
- If you prefer the dance baked as a two-person illustration instead of sprite-over-BG, add to
  BG-1: "…two figures dancing close, a proud dark-haired gentleman in formal black and a young
  woman in a deep-navy gown, mid-figure of the dance, eyes locked" and drop the "foreground open".
- Explore stays 3:2 even though backgrounds are now 1:1 — the wider panorama is what gives the
  point-and-click room to breathe; 1:1 backgrounds gain the parallax margin instead.
