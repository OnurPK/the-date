# roles-engine — the roles.ai visual-novel engine and its production pipelines

Use this whenever working on a roles.ai game built on the shared engine (`dialog2.html` player + `index.html` editor + `dev-server.js`): writing or wiring episode scripts, generating voices / music / sfx, character poses, cutscenes, map tiles, assets, or shipping. World-specific writing rules (tone, canon, season) live in each world's own skills; this skill is the engine.

## 0. Ground rules (every session)

- Never run git from the sandbox. The user pushes: `zsh tools/ship.sh "message"` (add/commit/push → Railway deploys web; the iOS shell loads the live web build, so web changes need no TestFlight). `--ios` only for native changes.
- Never read or handle secrets (`.env`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `FREEPIK_API_KEY`); never type passwords.
- The sandbox has no network. Anything that calls ElevenLabs / OpenAI / Freepik goes through the local dev server (`http://localhost:8000`, started by the user via `run.command`) and is triggered **from a Chrome tab** with `fetch(...)` (Claude-in-Chrome `javascript_tool`). Chrome MCP tabs run in the background: `requestAnimationFrame` is frozen and `<video>` won't load — verify visuals via DOM/computed styles, or ask the user to look.
- Editing `dev-server.js` requires the user to restart the server. Editing the game/editor HTML does not.
- Mobile first: "we worked hard on the mobile experience, don't break it." Desktop/wide mode (`?wide=1`, `play.html`) must never harm the phone layout.
- Don't invent tags for choice options that don't exist in the source; the user pushes when they decide.
- Files that the sandbox created earlier may be undeletable from the sandbox (permission); overwrite instead of delete.

## 1. Repo map

```
dialog2.html        the game (engine + all UI, single file)          index.html   the editor (loads the game in #gameFrame)
dev-server.js       static server + /api/author/* (assets, audio, voices, script tools)
play.html / wide.css   16:9 desktop player                             tools/ship.sh   publish
worlds/<world>/     everything that belongs to a world:
  episodes/<pack>/<episode>/scripts/main.txt      the script (engine DSL)
  episodes/.../cutscenes/*.jpg  videos/*.mp4  explore/*.jpg  voice/<folder>/<key>/<hash>.mp3  voice/directions.json
  characters/<folder>/appearances/pride.png (standing sprite, RGBA) · poses/<pose>/f00..f15.webp · character.json
  audio/manifest.json (slots, hooks, levels, randoms) · audio/voices.json · audio/{music,amb,sfx}/<slot>__<variant>.mp3
  map.jpg, map-locations.json, episode-locations.json, world-map.json, whispers.json, ui/, _mockups/
docs/               prototypes (proto-*.html), prompts, compare pages
```

The engine currently keys the world with `activePack === 'pride'` / `PRIDE_WORLD_BASE` / `body[data-pack="pride"]`. When a second world is added, make these a `pack` parameter rather than copying blocks.

## 2. Script DSL (`scripts/main.txt`)

Lines, top to bottom; `//` comments. Blank line after a `(Choice:n)` option list ends the options.

**State tags** (one line, can be combined): `[bg:scene=file.jpg]` `[bg:cutscene=file.jpg]` `[bg:explore=name]` · `[amb:slot]` `[music:slot]` `[random:set]` (audio) · `[ui:narrative|cast-small|cast-large|multi]` · `[pose:<speaker>=<pose>]` (`none` clears) · `[cast: left=<folder> right=<folder>]` (busts on whispers).

**Speech**: `Speaker: text` — `Narrative:` is the narrator; speakers map to sprite folders via `PRIDE_ACTORS` in dialog2.html (e.g. `Darcy`→mr_darcy, `Sir-William2`→sir_william2, `Arabella2`, `Arabella-Mind` → inner voice folder `arabella_mind`, `Lady`, `Officer`, `Carter`). Unknown speakers must be added to `VALID`/`PRIDE_ACTORS` + labels or they render as narrative. `**word**` = highlight. `{{input}}` = last free-text.

**Choices**:
```
[ui:multi]
(Choice:3)
Arabella: Spoken option. [trait: Sharpest Wit in the Room]
Narrative: An action option, described in third person. [trait: Weakness]
Arabella: Another spoken option.

(IfChoice:0) … (EndIf)   (IfChoice:1) … (EndIf)   (IfChoice:2) … (EndIf)
```
Rule: spoken options (`Arabella:`) are echoed by the heroine (cast-small) and voiced by her; action options (`Narrative:`) are **not** read aloud — the branch opens with the narrator telling the act in other words. A choice with a free-text field is the default 4th slot.

**Mechanics**: `(Situation: id | Title | description)` · `(Discovery: text)` · `(Relation: folder | desire|trust|affection | +1)` · `(Memory: folder | text)` · `(Trait: …)` `(Quest: …)` `(Unlock: location-id | title=…)` `(Combat: …)` `(Focus …)`.

**Character intro / suitor reveal**: `(Intro: mr_darcy | video=clip.mp4 | say=narration over the clip | breath=7.2)` — plays the suitor unlock card (video fullscreen, "Acquaintance made / name / traits / Continue"), optional episode clip override, narrator line shown+spoken over it, her breath sfx at N seconds on the clip's own clock. Marks the suitor discovered.

**Cutscene video**: `(Video: clip.mp4 | say=narration | cue=<sec>:<sfx.slot>[:<level>] | end=<hook>)` — plays under the dialog UI; last frame holds (tap to continue) unless `end=` gives a hook (plays it, then advances by itself). Follow with `[bg:cutscene=<last-frame>.jpg]` so the still under the clip matches (extract with ffmpeg `-sseof -0.1`).

**The Look (read-the-room explore)**:
```
(Look: image=explore/room.jpg | approach=<folder of who is coming> | seconds=80 | caption=Text shown on the strip)
(Spot: id | x=% | y=% | zoom=2.2 | label=The fans)
[ui:narrative]
Narrative: …        (any lines, cast-small inner voice, a (Choice:3) with branches, mechanics)
(EndSpot)
…more spots…
(EndLook)
(IfLooked:spotId) … (EndIf)
```
Room image is 3:2 (1920×1280), scrolls horizontally on phone; timer runs only in room view; each spot costs `seconds/6`; seen spots become ✓ and are not re-tappable; Skip button top-left; wide mode fits the image. Approach strip = gilded rail (`ui/look_rail.png`) with her bust left and his bust sliding in.

**Whispers (map)**: `whispers.json` — sequences of `narr` / dialogue beats with `[cast:]`, triggered on map return / day change; voices under `whispers/voice/`.

## 3. Voices (ElevenLabs, model eleven_v4)

`audio/voices.json`: `characters.<folder> = { active: "<key>", voices: { <key>: { id, name, note } }, settings: { model:"eleven_v4", stability, prefix, lufs, lowpass, echo, tempo, speed }, acting: { stability, register, allow:[…], never:[…] } }`. Speaker → folder: narrator, arabella2 (the PC), mr_darcy, … (`speakerFolder` in dev-server).

- **Acting envelope** (`acting`): per character, the directions allowed (`allow`) and forbidden (`never`); narrator is tone-stable (stability 1.0), actors 0.5. v3/v4 accept only stability 0 / 0.5 / 1; no style/speed/similarity.
- **Directions per line**: `episodes/<ep>/voice/directions.json` = `{ "<hash>": "[dry, unhurried]" }`; v3/v4 builds prepend `settings.prefix` (standing tags like `[whispers][softly] `) + the line's direction. Pick 1–2 tags from `allow` only. Hash = `fnv1a(speaker + '|' + cleanText)` (speaker key lowercase as in the script, e.g. `narrative`, `darcy`, `arabella2`, `arabella-mind`); clean = strip `[...]`, `{a|b}`→a, `**`.
- **Build**: `POST /api/author/voice-build {episode:"authored/<ep>", folder, voiceKey, force?}` → `{job}`; poll `GET /api/author/voice-job?job=id` (`done/total/running/errors/chars`). `force` regenerates and moves old takes to `<key>/_prev/<stamp>/` — never silently overwrites. Missing check: `GET /api/author/voice-lines?episode=…` → each line `have:{key:true}`.
- **New model / new take without losing the old**: add a new voice key (e.g. `v4`) with the same voice id, build into it, flip `active` when complete; the old key's files stay.
- **Post-process**: `POST /api/author/voice-post {episode, folder, voiceKey, tempo?, lufs?, lowpass?, echo?}` re-normalises files in place (loudnorm; trim; atempo; lowpass + aecho for "inside her head"). `gen-audio kind:'tts'` for one-off lines (e.g. `say=` narration) into the exact `voice/<folder>/<key>/<hash>.mp3` path.
- The `say=` text of `(Video:)`/`(Intro:)` is scanned as a narrator line; whispers episode id is `whispers`.
- Cost: v2 and v4 ≈ 1 credit/char; directions add ~12–15 %. A 180-line episode ≈ 12–14k credits (~$2.7 on Pro). `GET /api/author/eleven-usage` (updates lazily; compare before/after over minutes, not seconds).
- Compare pages: `docs/compare-v4.html` pattern — same line, today vs new, vote buttons.

## 4. Music · ambience · sfx

`audio/manifest.json`: `slots["music.name"|"amb.name"|"sfx.name"] = { active: "a" | "random" | "a,b", level?, variants: { a: { file, src, note, level? } } }`, `hooks` (engine event → sfx slot: advance, choice_open, choice, discovery, remember, desire, trust, affection, look_enter, look, look_back, look_cut, reveal_breath…), `levels` (amb .55, sfx .8, music .6, voice 1), `randoms` (sets of one-shots with gap ranges: map, ballroom, thinking, map_night).

- Generate: `POST /api/author/gen-audio` — music: `{kind:'music', prompt, seconds:60, instrumental:true, relPath:'worlds/<w>/audio/music/<slot>__<var>.mp3', note}`; sfx/amb: `{kind:'sfx', prompt, duration:≤22, influence:.5–.6, loop:true (amb), relPath:'…/audio/{sfx|amb}/<slot>__<var>.mp3'}`. Files named `<slot>__<variant>.mp3` register themselves in the manifest. Normalisation (loudnorm) is automatic.
- Switch what plays: `POST /api/author/audio-manifest {slots:{"music.x":{active:"b"}}, hooks?, levels?}`; in-game `prideAudio.setActive(slot, variant)` / `.hook(name)` / `.play(slot, mul)` / `.music(name)` / `.amb(name)`.
- Loops honour per-slot/variant `level` (`ch.mix`). Voice lines duck music/amb (DUCK .55). Choice focus low-passes music.
- Engine is Web Audio (buffers). Unlock: never call `AudioContext.resume()` outside a user gesture (Safari then stays suspended forever); listen to pointerdown/mousedown/touchend/click/keydown; a silent `<audio>` play() probe tells whether autoplay is allowed (then resume is safe). Media responses must not carry `Cache-Control: no-store` (Safari `<video>` goes black) — dev-server serves video/audio with `no-cache`.
- Costs: a 60 s music piece ≈ 600–700 credits, an sfx ≈ 40–100. Regenerating a whole manifest (60 slots) ≈ 8k credits.
- Compare page pattern: `docs/compare-audio.html` (today vs `n`, "use new" writes the manifest).

## 5. Images (gpt-image via dev server)

`POST /api/author/gen-asset {prompt, size:'1024x1536'|'1536x1024'|'1440x2560', relPath:'worlds/…png', refs:['<character folder>'] (uses appearances/pride.png), refPaths:['worlds/…'] (any reference image), transparent:true, maskPath:'worlds/…png' (inpaint: transparent pixels = regenerate), model:'gpt-image-1' (for `fidelity:'high'`; the default model rejects input_fidelity), provider:'freepik'}`.
- Reference edits **recompose** (the model moves/enlarges the subject). To keep alignment use a mask (inpaint only a region; the server composites the original pixels outside the mask) or derive procedurally (e.g. sketch from edges: bilateral → Canny two thresholds → sepia lines on parchment + hatching in shadows).
- Sprites: standing pose PNG with alpha (`appearances/pride.png`, ~1440×2560). Busts on UI: `background-size:auto 440%; background-position:50% 1%` cut hard at the bottom.
- Concept boards: generate 3–4 variants with the real screen as `refPaths` and "redesign only X, keep everything else exactly" — then rebuild the chosen one as real UI (extract the asset with `transparent:true`, isolated).
- Cost ≈ $0.19–0.25 per 1024×1536 high-quality image.

## 6. Character poses (16-frame clips)

Frames `characters/<folder>/poses/<pose>/f00..f15.webp` (640×1136-ish, same framing as `appearances/pride.png`), 8 fps; `POSE_SETS[folder] = { idles:[…], idleFor:{expr:[…]}, oneShot:[…], all:[…] }` and `POSE_FRAMES['folder/pose'] = 24` for longer clips. Expression clips hold their last frame (then breathe on the last frames or play their `idleFor` idle); `oneShot` clips (gestures that return to rest) play once, then release to the idles; idles loop with a pause between.

Pipeline:
1. Green start frame: sprite composited on #00B140, 1080×1920, figure height 86 %, feet at 93 % (`_mockups/<char>_poses/<char>_idle_green.png`).
2. Prompts (First+Last frame, Hailuo 2.3 or Seedance): `[Static shot] … Feet stay planted. Flat solid green background stays perfectly uniform. Painted illustration style, same face and clothes throughout. No text.` 4 s Seedance / 6 s Hailuo; loops must end on the start frame.
3. Frames: identify clips by frame diff vs frame 0 (peak time); for holds sample 0→peak inclusive, for loops 0→end exclusive; one ffmpeg pass per clip: `chromakey=0x00B140:0.13:0.06, crop to the sprite framing (map green-frame figure box → sprite bbox), scale, fps=16/dur` → PNG → **no despill filter** (it tints ivory/grass); instead in Python zero alpha < 28 and clamp G ≤ max(R,B) on semi-transparent rim pixels → webp q90.
4. Script: `[pose:<speaker>=<pose>]` before the line; add the folder to `POSE_SETS`.
Script: `docs/engine/pose_frames.py`.

## 7. Cutscenes (Seedance 2.5, reference images)

- Refs: face crops + full-body identity sheets per character, the room/setting stills, a two-shot for light/colour. Prompt template in `docs/cutscene-prompts-assembly.md`: 9:16, silent, painted candlelit look, "@Image1 in every frame", timed beats, last 2–2.5 s a calm hold with the subject in the upper 60 % (dialog box sits at the bottom).
- Incoming mp4 (720×1280, no audio): re-encode to 1080×1920 H.264 High 4.0 + silent AAC, `-movflags +faststart` (Seedance puts moov at the end → slow start; Safari needs faststart + Range + an audio track to behave). Extract the last frame as the still. Wire with `(Intro:)` (suitor reveal card) or `(Video:)`.
- Narration over a clip is shown as a narrative caption (`.vo-say`) and spoken; keep it ≤ 6 s; normal narrator pace (no tempo/speed) for these.
- Overlay hand-off: render the next beat under the clip first, keep the clip/card ~0.7 s, then fade — no flicker.

## 8. Map tiles — locked place = empty plot, unlock = construction time-lapse

1. Cut a tile from `map.jpg` (e.g. 560×400 at the location), organic mask (superellipse + noise, Gaussian edge) → `painted_alpha.png` (web) and `painted_green.png` (green outside the mask).
2. Empty plot: gpt-image inpaint with a mask over the building+grounds ("meadow, pegged-out ground plan, no building, seamless") → `empty_green.png` / `empty_alpha.png`.
3. Seedance first+last frame (`empty_green` → `painted_green`, 6–8 s): trenches, scaffolding, walls course by course, roof, chimneys, drive, trees grow; green outside stays uniform.
4. Alpha video: do **not** chromakey (map greens get keyed/despilled); the clip's green region equals the mask, so `alphamerge` with the mask eroded ~7 px and feathered: `ffmpeg -i clip.mp4 -i mask_video.png -filter_complex "[0:v]format=rgba[v];[1:v]format=gray[m];[v][m]alphamerge,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 26 -auto-alt-ref 0 -an build.webm`. Safari/iOS needs an HEVC-alpha `.mov` twin (`hevc_videotoolbox` on the Mac). The `<video>` sits in the tile rect with a CSS mask; under it the empty layer, after it the painted layer. Prototype: `docs/proto-map-tiles.html`, files `_mockups/map_tiles/<loc>/`.

## 9. UI conventions

UI v2 (P&P): Playfair Display titles, Inter UI, Cormorant italic narrative; buttons BTN-1..5 in `#ui-v2`; icons one SVG set; safe-area top/bottom on every fixed control; back arrows top-left; skip top-left in the Look; location card = invitation (cream, gold rule, ink CTA "Attend"). Cast-small bust on the right → centre zoomed subjects at 38 % width on phone. Captions between busts on the approach strip, fade after 4 s.

## 9b. iOS memory (the app reloading mid-episode)

The Capacitor shell is a WKWebView; iOS kills the web content process near ~1 GB and Capacitor reloads the page, which looks like a random restart. First stop: Settings → Diagnostics in the game lists "Unexpected reloads" with the episode and the beat index (`rai.crashlog`, written by `prideLiveMark` in `renderLine`); the beat number tells you which screen is the culprit. Rules learned the hard way: no `will-change: transform` on big scaled layers (the Look room was a 3800×2550 px GPU layer, re-rasterised at ×2.1 on zoom); no `backdrop-filter` on elements inside a transformed/scaled layer (each one forces an offscreen copy — use a more opaque solid background instead); pose frames are ~2.9 MB decoded each, so the pose engine keeps only the clip on screen + the next one per character (`trim`/`next` in the pose IIFE) and prefetches during the idle pause; decoded audio loops are pruned to the ones playing (`pruneBufs`); `<video>` elements get `removeAttribute('src'); load()` when done. Budget a screen at < 300 MB of decoded images.

## 9c. Mobile map stutter (everything on the map slow, desktop fine)

Desktop fine / phone slow = GPU compositing, not JS. Suspects in order: a **live filter on a map-sized layer** (SVG feTurbulence or CSS `filter`/`backdrop-filter` on something as big as the map: WebKit re-filters it on every pan frame — the fog did this), full-screen `mix-blend-mode` layers, dozens of CSS pin animations, walkers with `will-change`. Rules: rasterize any filtered map-sized art once to a bitmap (`rasterFog`: SVG → `<img>` → canvas → blob URL, re-made only when the set changes; live SVG only for the 1.7 s dissolve); never put a CSS filter on `#prideFog` / `.map-world`; per-frame JS must not read layout (`getBoundingClientRect`) — cache pin centres (`dotC`, 1.5 s). Isolate on a device with Settings → Dev → Perf flags (no fog / no night veil / no pin animations / no walkers) instead of guessing; these flip body classes `dev-nofog` … and persist in `rai.dev.*`.

## 10. Prototyping method

Design questions → a `docs/proto-*.html` page with 3–5 alternatives side by side (sliders/play to animate), or 3–4 gpt-image concept boards from the real screenshot; the user picks; then implement in the engine. Keep prototypes; they are the design record.

## 11. Testing from Chrome

Editor: `http://localhost:8000/index.html` — `startMapBtn` starts a fresh game on the map; tap through whispers; open a POI; `poiStart`. Jump inside a script: `w.eval('idx=N; renderLine()')` (find N in `w.eval('lines')`); set `lastChosenIdx` before jumping into an `(IfChoice)` block. `next()` advances. Audio state: `w.prideAudio.state()`. Voices: `/api/author/voice-lines`. Console noise "message channel closed" is extension chatter.
