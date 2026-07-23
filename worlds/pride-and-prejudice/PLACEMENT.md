# Pride & Prejudice — asset PLACEMENT (v2: location vs episode)

Architecture: **location = reusable stage** (empty explore refs + reusable backgrounds).
**episode = episode-specific content** (script, cutscenes, filled explore, music, objects).
Pack id = **`pride`** → per-world filenames are `pride.png` / `pride.jpg`.

```
worlds/pride-and-prejudice/
  characters/{id}/appearances/pride.png   (+ profile/pride.jpg)     ← 12 sprites (world-local, reusable)
  locations/netherfield-ball/
    explore/       ← EMPTY explore backdrop(s) — reference/base for generating the filled ones
    backgrounds/   ← reusable location/stage backgrounds (the ballroom seen various ways)
  episodes/the-newcomer/the-netherfield-ball/
    scripts/main.txt
    cutscenes/     ← episode-specific narrative cutscenes (two-person moments etc.)
    explore/       ← FILLED/dressed explore backdrop (the one actually played)
    music/
    objects/
    (design docs: ASSETS.md · PROMPTS.md · CHARACTER_PROMPTS.md)
```
> ⚠️ Series folder name `the-newcomer` and episode `the-netherfield-ball` are my best guess
> (from the JSON `playable: the_newcomer` + episode id). Rename with one `mv` if you want different.

═══════════════════════════════════════════════════════════════════════
## 1 · CHARACTER SPRITES  (PNG cutout) — world-local, reusable across episodes
`worlds/pride-and-prejudice/characters/{id}/appearances/pride.png`  (+ optional `profile/pride.jpg`)

| concept (costume)                        | id (folder)        |
|------------------------------------------|--------------------|
| Navy sleek gown, sharp — **PC**          | `arabella_frost`   |
| Black tailcoat, ivory waistcoat, austere | `mr_darcy`         |
| Colourful cravat, young                  | `mr_bingley`       |
| Bold red gown, emerald                   | `miss_bingley`     |
| Scarlet militia coat, boots              | `mr_wickham`       |
| Blush-pink gown, blonde                  | `jane_bennet`      |
| Dusty-rose gown, cream gloves            | `elizabeth_bennet` |
| Mustard/gold gown, feathered turban      | `mrs_bennet`       |
| Clerical black, top hat                  | `mr_collins`       |
| Sage/olive empire gown                   | `charlotte_lucas`  |
| Purple off-shoulder, auburn + flowers    | `lydia_bennet`     |
| Older bearded gentleman, black tails     | `sir_william`      |

═══════════════════════════════════════════════════════════════════════
## 2 · REUSABLE LOCATION BACKGROUNDS  (JPG)
`worlds/pride-and-prejudice/locations/netherfield-ball/backgrounds/`
The stage — the ballroom seen various ways, shared by any episode set at Netherfield:

| file (exact)          | used by (this episode) | art (PROMPTS.md) |
|-----------------------|------------------------|------------------|
| `ballroom-blaze.jpg`  | the_ballroom (HUB)     | EX-1 / ballroom concept, cropped 1:1 |
| `officers-corner.jpg` | the_officers_blade     | BG-2 |
| `pianoforte.jpg`      | the_rivals_performance | BG-3 |
| `alcove-shadow.jpg`   | the_overheard_crack    | BG-4 |
| `thinning-ball.jpg`   | the_thinning_ball      | BG-5 |

`worlds/pride-and-prejudice/locations/netherfield-ball/explore/`
| `backdrop.jpg` | EMPTY reference version of the supper/ballroom explore (base for the filled one) |

═══════════════════════════════════════════════════════════════════════
## 3 · EPISODE-SPECIFIC ASSETS  (JPG)
`worlds/pride-and-prejudice/episodes/the-newcomer/the-netherfield-ball/`

**`cutscenes/`** (story-moment illustrations for this episode)
| file (exact)             | used by            | art |
|--------------------------|--------------------|-----|
| `the-dance-set.jpg`      | the_dance (PEAK)   | BG-1 |
| `dance-with-another.jpg` | the_other_partner  | BG-1 variant |
| `carriage-night.jpg`     | the_last_carriage  | BG-6 |
| `cover.jpg`              | episode cover tile | BG-7 |

**`explore/`**  → `backdrop.jpg` = FILLED supper explore (the one played), dressed from EX-2.
**`music/`** · **`objects/`** → as needed.

═══════════════════════════════════════════════════════════════════════
## 4 · ENGINE WIRING (dialog.html — your code; flagged so it actually loads)
1. **packId `pride`**: `PACKS.push({id:'pride',name:'Pride & Prejudice'})`.
2. **PACK_LOCATION now needs an EPISODE path too** (currently only `{world, location}`):
   e.g. `{ world:'worlds/pride-and-prejudice', location:'locations/netherfield-ball',
   episode:'episodes/the-newcomer/the-netherfield-ball' }`.
3. **Background resolver must search EPISODE first, then LOCATION:**
   `[bg:cutscene=X]` / `[bg:scene=X]` → try `{episode}/cutscenes/X`, else `{location}/backgrounds/X`.
   `[bg:explore]` → `{episode}/explore/backdrop.jpg` (falls back to `{location}/explore/backdrop.jpg`).
4. **World-local characters resolver**: sprites are under the world now, not root —
   `worlds/pride-and-prejudice/characters/{actorId}/appearances/pride.png`. NOTE: the PC is a
   NAMED character here — actor id `arabella_frost`, NOT the engine's generic `you`; the PC/`me`
   resolver must map to `arabella_frost` for this pack.
5. **Cast map**: speaker→id — Arabella→`arabella_frost`, Darcy→`mr_darcy`, Bingley→`mr_bingley`,
   Miss Bingley→`miss_bingley`, Wickham→`mr_wickham`, Jane→`jane_bennet`,
   Elizabeth→`elizabeth_bennet`, Mrs Bennet→`mrs_bennet`, Collins→`mr_collins`,
   Charlotte→`charlotte_lucas`, Lydia→`lydia_bennet`, Sir William→`sir_william`.
6. `scripts/main.txt` now lives under the episode, not the location.

## Cleanup
Empty leftover scaffold dirs were moved to `worlds/pride-and-prejudice/_to_delete/` — safe to delete
(device can't rm from here).

## Drop-in checklist
- [ ] 12 sprites → `characters/{id}/appearances/pride.png`
- [ ] 5 reusable bgs → `locations/netherfield-ball/backgrounds/<name>.jpg`
- [ ] 1 empty explore ref → `locations/netherfield-ball/explore/backdrop.jpg`
- [ ] 4 episode cutscenes → `episodes/.../the-netherfield-ball/cutscenes/<name>.jpg`
- [ ] 1 filled supper explore → `episodes/.../the-netherfield-ball/explore/backdrop.jpg`
- [ ] engine: pack + episode path + resolver (episode→location) + world-local chars + cast map
