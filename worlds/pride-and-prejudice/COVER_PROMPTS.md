# Pride & Prejudice — location COVER prompts

Cover = the card/tile image for a location (engine format **4:3**, ~1448×1086).
Cinematic & atmospheric to match the photoreal backgrounds. One establishing shot per place.
Compose each as: **`[COVERSTYLE] + <the place> + --ar 4:3 + [NEG]`**

## [COVERSTYLE]
> cinematic establishing shot, Regency England, painterly-photoreal, warm candlelit / moonlit
> atmosphere, rich period detail, dramatic lighting, shallow depth, evocative and inviting

## [NEG]
> text, watermark, modern objects, cars, power lines, people's distorted faces, cartoonish

═══════════════════════════════════════════════════════════════════════
## OPEN / EPISODE locations

### `netherfield` — the Netherfield Ball (our episode)
`[COVERSTYLE] +` a grand Georgian country hall at night seen from the sweeping front drive, every
tall window blazing gold with candlelight, carriages arriving, a crescent moon above, warm light
spilling onto pale stone steps — a great ball in full glow. `--ar 4:3 + [NEG]`

### `the-assembly-rooms` — Meryton assembly (episode 1)
`[COVERSTYLE] +` a modest provincial town assembly hall, candlelit windows warm against a blue
evening, a few couples glimpsed dancing inside, a fiddler's silhouette, cobblestones out front —
lively, small-town, intimate. `--ar 4:3 + [NEG]`

═══════════════════════════════════════════════════════════════════════
## INTERACTIVE locations

### `longbourn` — the Bennet home
`[COVERSTYLE] +` a modest but handsome red-brick English manor at golden dusk, ivy on the walls,
a gravel sweep and a garden gate, warm lamplight in a downstairs window, hens and a kitchen
garden — homely, lived-in, genteel-but-not-grand. `--ar 4:3 + [NEG]`

### `lucas-lodge` — Sir William Lucas's house
`[COVERSTYLE] +` a comfortable small country house on a rise, neat lawns and a short avenue of
limes, soft late-afternoon light, a modest air of respectability — smaller and plainer than the
great estates. `--ar 4:3 + [NEG]`

### `meryton` — the village
`[COVERSTYLE] +` a Regency market-town street, timber and brick shopfronts, a church spire, a
scatter of **militia officers in scarlet coats** among townsfolk, market awnings, warm afternoon
bustle — the social heart of the neighbourhood. `--ar 4:3 + [NEG]`

═══════════════════════════════════════════════════════════════════════
## LOCKED locations (later chapters) — render mistier / cooler / distant to read as "locked"

### `pemberley` — Darcy's great estate (locked)
`[COVERSTYLE] +` a vast, magnificent Derbyshire estate across a mirror-still lake at cool dawn,
grand classical façade half-veiled in silver mist, wooded hills behind — awe-inspiring, remote,
just out of reach. `--ar 4:3 + [NEG]`

### `rosings` — Rosings Park & Hunsford (locked)
`[COVERSTYLE] +` an imposing, ostentatious great house with formal clipped gardens under a cold
grey sky, wrought-iron gates closed, a small humble parsonage at the edge of the park — grand,
forbidding, faintly chilly. `--ar 4:3 + [NEG]`

---
## Placement
| cover | goes to |
|-------|---------|
| netherfield ball cover | `episodes/the-newcomer/the-netherfield-ball/cover.jpg` |
| other locations | `worlds/pride-and-prejudice/locations/<location>/cover.jpg` (once those locations exist) |

> Locked covers: keep them mistier/cooler so the tile reads as "not yet open" even before any
> lock overlay is added.
