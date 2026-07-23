# Netherfield Ball — asset manifest (PLACEHOLDERS)

All art below is referenced by `scripts/main.txt` but not yet produced.
Filenames are placeholders — swap freely, just keep the names in sync with the script.

## Backgrounds — `cutscenes/`  (full-bleed `[bg:cutscene=…]`)
- `ballroom-blaze.jpg` — the blazing hub ballroom, whole country dancing, Darcy a fixed point across the floor
- `officers-corner.jpg` — red-coats by the wall, one handsome smile leaning in (Wickham)
- `pianoforte.jpg` — Miss Bingley mid-performance, Darcy's gaze in the wrong place
- `alcove-shadow.jpg` — shadowed alcove by the far windows, Darcy + Bingley in low conference
- `thinning-ball.jpg` — emptying room, guttering candles, wraps and called carriages
- `carriage-night.jpg` — dark road home, lamplight + hedgerows, lit house shrinking behind

## Scene illustrations — `cutscenes/`  (two-person `[bg:scene=…]`, used with bubbles)
- `the-dance-set.jpg` — the formed set on the floor, Arabella + Darcy close and formal (SPINE PEAK)
- `dance-with-another.jpg` — Arabella luminous with a forgettable partner, Darcy at the wall watching

## Explore scene — `[bg:explore]`
- The supper table (situation `the_supper_table`) uses an interactive explore scene with clickable
  character hotspots — no single bg file; needs an explore layout + hotspot art for each node below.

## Character sprites referenced (supper `(Object:… character=…)` + cast boxes)
Main cast: `mr_darcy`, `mr_bingley`, `miss_bingley`, `mr_wickham`
Ambient:   `mrs_bennet`, `lydia_bennet`, `charlotte_lucas`, `mr_collins`, `jane_bennet`, `elizabeth_bennet`
Minor:     `sir_william` (Sir William Lucas — has a line in the hub + supper)
PC:        `the_newcomer` (Arabella Frost)
> Note: a nameless "forgettable partner" (the_other_partner) is a prop, no sprite needed.

### Concept art → character mapping (CONFIRMED 2026-07-15, Onur)
ALL 12 cast sheets designed. Assignments:
- Dusty-rose gown, square neck, long cream gloves, brown hair  → `elizabeth_bennet`
- Bold red gown, emerald necklace, black opera gloves          → `miss_bingley`
- Purple off-shoulder gown, auburn hair + flowers, showy       → `lydia_bennet`
- Navy sleek gown, dark hair, gold pendant, cool/sharp          → `the_newcomer` (Arabella, PC — LEAD)
- Blush-pink flowing gown, blonde, gentle                      → `jane_bennet`
- Older bearded gentleman, black tails, cream waistcoat        → `sir_william`
- Younger man, colorful cravat, cream lapels, confident        → `mr_bingley`
- Mustard/gold gown, plum trim + bows, feathered turban, fan   → `mrs_bennet`
- Clerical black, white bands, holding top hat                 → `mr_collins`
- Sage/olive empire gown, plain, hands folded, composed        → `charlotte_lucas`
- Black tailcoat, ivory waistcoat, austere, proud, dark hair   → `mr_darcy`
- Scarlet militia coat, navy facings, cross-belt, boots, smiling → `mr_wickham`

> Cast art COMPLETE (12/12). Next: generate EX/BG backdrops (PROMPTS.md) and composite sprites (Model B).
> Optional polish: Collins reads a touch dignified vs the pompous-buffoon brief; background tone varies
> white/cream across sheets (irrelevant after cutout).

## Location cover
- `cover.jpg` — location tile (standard, sits at the location root like other venues)

## Music — `music/`
- ball music bed(s) for the floor; a thinner/cooler cue for the coda + carriage (script ends on `(Music)`)

## Memories — `memories/`
Polaroid/keepsake art for the discoveries that write a memory note, e.g.:
`he_asked_knowing_the_cost`, `darcy_will_not_defend_himself`, `darcy_undone_in_private`,
`caroline_performing_for_him`, `darcy_cannot_hide_it`, `wickham_story_has_holes`,
`the_family_is_its_own_undoing`, `charlotte_counts_the_cost`, `an_ally_across_the_table`.
