# P&P — engine integration (remaining, after the theme)

DONE (safe, applied):
- Theme wired: fonts + `worlds/pride-and-prejudice/theme.css` linked in `dialog.html`
  (scoped `body[data-pack="pride"]`, cosmetic only). Backups: `dialog.html.bak-theme`,
  `dialog.html.bak-packloc`.
- `PACK_LOCATION['pride']` added (world + location + episode) — inert until the pack is active.
- `theme.css` sets `--explore-bg` to the hub ballroom for this world.

NOT applied yet (needs your call + your selection-flow redevelopment; can't be launched/tested
without it, so left out of the production file rather than guessing):

## A. ONE design decision — background resolver
`resolveWorldAsset()` (dialog.html ~14035) returns a SINGLE path
`${currentLocationBase()}/${folder}/${filename}` — it can't try episode-then-location.
Our split (reusable→`locations/…/backgrounds`, episode→`episodes/…/cutscenes`) needs one of:
  1. **Simplest:** put ALL P&P bgs in the episode `cutscenes/` folder → resolver just needs the
     pride branch below pointing `folder` at the episode base. (drop the location/backgrounds split)
  2. keep the split + add a filename→folder map for pride.
Pick one; the guard below assumes (1).

## B. Pack-guarded resolver edits (apply when launch exists)
All guarded on `activePack === 'pride'` so London/1984 code paths stay byte-identical.

1) **PACKS** (~13201) — add when the selection flow can launch pride:
   `{ id: 'pride', name: 'Pride & Prejudice' }`

2) **episode base helper** (near currentLocationBase ~14018):
   `function currentEpisodeBase(){ const m=PACK_LOCATION[activePack]; return m.episode ? `${m.world}/${m.episode}` : currentLocationBase(); }`

3) **resolveWorldAsset** (~14044) — pride uses the episode folders:
   ```
   const base = (activePack==='pride') ? currentEpisodeBase() : currentLocationBase();
   const folder = (kind === 'scenes') ? 'cutscenes' : kind;
   return `${base}/${folder}/${filename}`;
   ```
   (explore stays via `--explore-bg`, already set in theme.css.)

4) **main script load** (~25954):
   ```
   const url = (activePack==='pride')
     ? `${currentEpisodeBase()}/scripts/main.txt`
     : `${currentLocationBase()}/scripts/main.txt`;
   ```

5) **world-local sprite path + PC name** — 4 sites: `npcImagePath` (~13586),
   `actorPhotoFor` (~18754), `refreshCastingUI` body img (~18793), `galleryCast` (~25339).
   Wrap each `characters/${id}/appearances/${activePack}.png` as:
   ```
   activePack==='pride'
     ? `worlds/pride-and-prejudice/characters/${id==='me'||id==='you'?'arabella_frost':id}/appearances/pride.png`
     : `characters/${id}/appearances/${activePack}.png`
   ```
   (best: make one helper `spritePath(id)` and call it at all 4 sites.)

6) **named explore** — script uses `[bg:explore=ballroom]` / `[bg:explore=supper]`.
   Engine currently only knows bare `[bg:explore]` → `--explore-bg`. Either:
   - set `--explore-bg` dynamically when a `=name` is parsed (map name→
     `locations/netherfield-ball/explore/<name>.png`), or
   - keep one explore backdrop and use bare `[bg:explore]` in main.txt for now.

7) **cast map** — the script's speakers (Arabella, Darcy, Bingley, Miss Bingley, Wickham,
   Jane, Elizabeth, Mrs Bennet, Collins, Charlotte, Lydia, Sir William) must map to the
   actor ids (folders). P&P is NOT a "cast your friends" world, so it should BYPASS the
   casting modal (rolesForPack('pride') is already []). The launch flow just needs to set
   `activePack='pride'`, `currentVenue='netherfield-ball'`, skip casting, then
   `loadActiveScript()`. This is the piece to build in the selection redevelopment.

## C. Assets
Backgrounds still being generated (BACKGROUND_PROMPTS.md). Sprites 8/12 (+ you'll cut in PS).

— Every edit above is additive + `activePack==='pride'`-guarded. I can apply them the moment
you have a launch path (or say "apply them dormant"), with backup + verification.
