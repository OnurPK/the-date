# Planning-review questions (label: question) — pass 1

49 questions from the team about the v2 prototype (source of truth: https://the-date-production.up.railway.app/). Each block: what they ask · my draft answer (from what the prototype actually does today; anything I am guessing is marked *(guess)*) · a line for you.

**How to use:** write under `Onur:` in your own words — "ok", "no, …", a correction, a decision. Leave blank = you agree with the draft. In pass 2 I rewrite the final answers from your notes, then you pick which ones I post as Jira comments.

---

## Title screen · registration · main menu

### ROL-1335 — Start Game visible before sign-in; where is Sign in?
**They ask:** Should Start Game be hidden until signed in, and the second button be "Sign in / Register"?
**Draft:** Start Game stays visible: it is the guest path (play now, register later — we don't want an account wall before the first minute). The second button becomes "Sign in / Register" (one button, one sheet with both tabs). Progress made as guest is carried into the account on sign-in.
**Onur:**

### ROL-1336 — Are date/time/place of birth required at registration?
**They ask:** Needed only for Trust the Stars or always? Is native Game Center / Play Games sign-in OK? Consent/terms step?
**Draft:** Not required at registration. Birth data is asked only when the player opens Trust the Stars (and stays optional there). Native Game Center / Play Games sign-in is fine and preferred over passwords; Apple/Google sign-in as the fallback. One consent/terms checkbox on the register sheet is enough.
**Onur:**

### ROL-1337 — "Let's add you to the game" (body type & height) still intended?
**They ask:** Team thinks it is the old flow left over after Register → Continue. Remove or keep?
**Draft:** Remove from the register path. Body type/height are not part of alpha character creation (the heroine is a template or a custom sprite; the player's photo only feeds the portrait). If we ever need body type it belongs in the custom-character flow, not after registration.
**Onur:**

### ROL-1338 — For alpha, enter the world directly instead of the Main Menu?
**They ask:** Sadok disliked "Enter the world". Keep the menu, rename the CTA, or skip it?
**Draft:** Keep the world hub screen even with one world — it is the place for the trailer, the world blurb and later worlds — but make the CTA a single big Play. With one world and a character already created, Play goes straight to the map; the hub is shown only on a fresh start or when the player backs out of the world.
**Onur:**

### ROL-1339 — Match Onur's fonts/styles exactly or use Tuce's selection?
**They ask:** Are prototype fonts approved and free? Guideline or exact spec?
**Draft:** The prototype is a guideline, not a pixel spec. Fonts in the prototype are free (Playfair Display, Inter, Cormorant Garamond — Google Fonts, OFL). The UI v2 rules (buttons, type scale, icons) in docs/ui-guideline-v2.html are the reference for the P&P world; type families may differ per world later, so the client should keep them as theme tokens.
**Onur:**

### ROL-1340 — World hero: one image + one video, or a media playlist?
**They ask:** Alpha decision is one image + one video. Do you want several clips with subtitles/progress?
**Draft:** One image + one 15 s silent trailer, looping, cross-fading back to the image. No playlist for alpha.
**Onur:**

### ROL-1341 — Are Short Stories and Chat with Characters in alpha?
**They ask:** Both are in the prototype but taps do nothing. Where does short-story content come from? Chat shown locked? Emre proposes bottom nav / quests / rewards.
**Draft:** Short Stories: in alpha as a small feed of authored vignettes (same script format as episodes, 1 situation, no choices or one). Chat with Characters (infinite dialogue) is in alpha only inside the world (suitor visit → talk), not as a main-menu entry — hide that tile for alpha rather than showing it locked. No bottom navigation on the hub; quests and rewards live on the map HUD.
**Onur:**

## Character creation

### ROL-1342 — How to distinguish saved characters from templates?
**They ask:** Same template used several times (5× Henrietta with different names). Visual difference?
**Draft:** Two rows on Choose your heroine: "Your heroines" (saved, with the player's name and a small "based on Henrietta" caption) and "Templates". Saved cards carry the custom portrait if one was taken; templates never do. A saved character can be duplicated or deleted from its card.
**Onur:**

### ROL-1343 — Outfits in template preview: preview or selection?
**They ask:** Is the outfit used for avatar generation / episodes or only a preview? Future wardrobe / monetisation?
**Draft:** Selection: the chosen outfit is the heroine's default look on the map (idle) and in episodes unless the episode script sets its own outfit (ball gown at Netherfield etc.). Wardrobe with buyable outfits is a post-alpha monetisation idea, not alpha.
**Onur:**

### ROL-1344 — Trait card visuals in alpha?
**They ask:** Tuce's trait-card visuals are on hold; prototype shows plain text cards. Needed?
**Draft:** Plain text cards are fine for alpha; the trait name, one-line meaning and the "how it plays" example are what matter. Visual cards can come later.
**Onur:**

### ROL-1345 — "Retake" wording when no photo was taken
**They ask:** Retake makes no sense if the user continued without a portrait. Back/Cancel?
**Draft:** Agree. If no photo was taken the button reads "Take a portrait" and there is a top-left back arrow; "Retake" only appears once a photo exists.
**Onur:**

### ROL-1346 — Reveal: static images or AI video walking out of the curtain?
**They ask:** Video is slow/risky; propose static before/after. Full-body in the chosen outfit needed. Which button after the reveal?
**Draft:** Static for alpha: curtain animation is UI (CSS), the heroine is a generated full-body still in the chosen outfit; no per-player video. After the reveal one button: "Begin" (goes to the map). Video reveals stay for suitors, where clips are pre-rendered.
**Onur:**

### ROL-1347 — Is Trust the Stars (birth chart) in scope?
**They ask:** Prototype shows "coming next".
**Draft:** Not in alpha. Keep the tile as "coming next" (it tests interest) or hide it — either is fine.
**Onur:**

### ROL-1348 — How should the two character-creation flows converge?
**They ask:** Custom path lacks the stage reveal, body type after story; template path picks outfits first. Proposed: body type → outfit → reveal → start for both. Why body types if AI-generated? Player's own face as option?
**Draft:** One flow for both: (1) pick template or "create your own" → (2) name + story questions (custom only) → (3) outfit → (4) portrait (optional, camera/mirror) → (5) reveal → Begin. Drop body type entirely; the generated full-body follows the template. The player's own face is only used for the portrait, not composited onto the body in alpha.
**Onur:**

### ROL-1349 — Keep "Edit character" free text and the background paragraph?
**They ask:** Free text can contradict story answers. Keep, restrict, or remove? Show background text?
**Draft:** Show the generated background paragraph (it is the payoff of the story questions) but make it read-only for alpha; editing is by re-answering a question. Free text comes back later as "small edits" on highlighted words.
**Onur:**

## Map · world

### ROL-1350 — How does the player exit a world back to the Main Menu?
**They ask:** No visible way back.
**Draft:** Settings (gear on the map HUD) → "Leave world" returns to the hub; the back arrow on the hub returns to the title screen. Same Settings sheet is reachable from the intro.
**Onur:**

### ROL-1416 — Which episode does the map focus on when several are available?
**Draft:** The one with the lowest `order` among available episodes; if the player has an in-progress episode, that one wins. The focus is a soft pan, not a lock — the player can pan away.
**Onur:**

### ROL-1417 — Mrs Frost tutorial: when is it shown and what drives it?
**They ask:** First open only or every time? Quest #1 or map highlights? What else should it say?
**Draft:** First map open only (flag in save). It is authored as a whisper sequence (whispers.json), not a quest: it introduces the map, points at the first episode pin and the Suitors button. Later whispers (Charlotte etc.) are driven by turn/day and the location the player just left.
**Onur:**

### ROL-1418 — Tutorial poses and idle animations: outfit, source, face swap?
**They ask:** Should the pose show the chosen outfit? Where do full-body idles come from? Is the player's face swapped in?
**Draft:** Yes, the map idle shows the chosen outfit (one idle clip per outfit, pre-rendered: Seedance loop keyed to alpha). No face swap in alpha; the map bust is the template's face. Editor waist-up/knees-up poses are for episodes; the map uses these separate full-body loops.
**Onur:**

### ROL-1419 — Should locked episodes be hidden on the map?
**They ask:** Client shows a lock state; prototype has none. Show or hide? The data starts with The Assembly Rooms, not Netherfield — which is first?
**Draft:** Show locked episodes as pins with a lock (no title reveal) so the map reads as a season; hidden only when the fog covers the region. First episode is The Assembly Rooms (the-assembly); Netherfield follows. The location card for a locked pin shows "Episode · not yet" and what unlocks it.
**Onur:**

### ROL-1420 — Scandal and Allure: what are they for?
**Draft:** Kept as visuals in alpha. Later: Allure = how desirable the heroine is in society (sum of suitor desire + wit-tagged choices), Scandal = reputation risk (choices tagged Weakness/impropriety, missed appointments, being seen alone). Both are world-state values written by episode mechanics, read by scripts for gating.
**Onur:**

### ROL-1421 — Music and sound: a user story in every epic?
**Draft:** Yes, one sound/music story per screen epic. The map already has a design in the prototype: day/night music, town/forest ambience blended by pan position, sparse random one-shots (carriage, bell, rooks); the audio manifest (audio/manifest.json) is the spec.
**Onur:**

### ROL-1423 — How does the alpha end, and how is region progress counted?
**They ask:** End mid-region or after season 1? Progress cannot count branching episodes.
**Draft:** Alpha ends with the Hertfordshire season (the last authored episode shows an "end of season" card). Region progress = completed *story beats* on the season's main line (each fork counts once when either branch is done), not raw episode count.
**Onur:**

### ROL-1546 — When exactly do finished / missed events disappear from the map?
**Draft:** Rule: an episode pin stays until the day it was scheduled for ends (next "pass the time" into a new day). Played → pin turns to "done" and disappears at day end; missed/expired → shows the missed state until day end, then disappears and its consequence fires. Locations (places) never disappear.
**Onur:**

## Suitors · characters

### ROL-1424 — Suitors game design (Sadok/Onur)
**They ask:** Who is a suitor — flag or derived? Only single men? How/when do they unlock? Two images or one + silhouette?
**Draft:** A suitor is a character flag (`suitor: true` in the character DB), always a single man in this world. Unlock = first `(Intro:)` in an episode (the reveal moment); until then the suitor appears as a silhouette card with a hint line. Two images per suitor: silhouette (shared template) and the reveal portrait.
**Onur:**

### ROL-1425 — Suitors are missing from Tuce's UI plan
**Draft:** Agreed, they must be added: Suitors list (grid of cards, locked = silhouette), Suitor detail (orbit screen: portrait, bonding level, three meters desire/trust/affection, observed traits, memories/discoveries, visit button). The prototype screens are the reference.
**Onur:**

### ROL-1426 — Which suitor stats exist and what do they mean?
**Draft:** Engine today: three relationship meters — desire, trust, affection (0–10, written by `(Relation: suitor | meter | +n)`), a bonding level derived from their sum, and observed traits + memories from `(Trait)` / `(Memory)` / `(Discovery)`. "Available / courting" are states, not stats: available = unlocked, courting = bonding ≥ 2. Mock-up names (curiosity, regard, warmth) should map onto desire/trust/affection.
**Onur:**

### ROL-1536 — Suitor detail: scope for alpha and where the data comes from
**They ask:** Turntable + 3D facets is the most complex screen. Alpha? 3D or sprites?
**Draft:** In alpha, but sprites, not 3D: the orbit screen uses pre-rendered turntable frames. Data: bonding level and meters from the relationship state, trait observation from `(Trait)` mechanics ("not yet observed" until first seen), discoveries stored as memories. The 3D facets idea is dropped.
**Onur:**

### ROL-1535 — How is a suitor's level change notified?
**They ask:** Yellow ring on the player portrait reads like the player's stats changed. Keep underline, add level-up notification? GM memories a notification too?
**Draft:** Keep the underlined narration for discoveries. Relationship changes show as a small toast with the suitor's face and the meter that moved (the prototype's heart/trust toasts); a bonding level-up gets its own card ("Mr Darcy — Acquaintance → Interest"). Memories ("will remember this") are a toast too, with the memory icon. Drop the yellow ring on the player portrait.
**Onur:**

### ROL-1538 — Is the character reveal only for suitors?
**Draft:** Reveal cards are for suitors only (unlock moment). Side characters get a lighter introduction: name label + a one-line who-they-are the first time they speak, no card.
**Onur:**

### ROL-1537 — Player profile: a page like the suitors?
**They ask:** Do we want a player profile / customisation page? Radial menu (episode) or right column (map)? Older menu replaced?
**Draft:** Post-alpha for the full page. In alpha the portrait opens a small sheet: heroine name, traits, outfit, "Switch heroine" (fixed). Menu pattern: right column on the map, radial in episodes — both stay, they serve different contexts. The old episode menu (discovery, infinite talk) is replaced by the radial.
**Onur:**

### ROL-1422 — What does the player portrait open?
**Draft:** Same as 1537: a small profile sheet (not a HUD toggle). "Switch character" is a bug.
**Onur:**

## Episodes · gameplay

### ROL-1428 — Episode vs place vs location vs short story
**They ask:** Netherfield/Assembly are episodes shown as locations. Should they be places with episodes inside? What is a place? Infinite talk there? Short stories?
**Draft:** Locations are pins on the map. A location can hold: an episode (timed, story), a place (persistent: library, bakery, a suitor's house — you can visit and talk), a short story. An episode is attached to a location for a day; the location itself persists. Infinite talk happens at places when an NPC is present (their schedule). Short stories are listed in the feed and at their street location.
**Onur:**

### ROL-1541 — What are places for?
**They ask:** Places only let you meet NPCs you can already meet at home. Does anything change by place?
**Draft:** Places give context and schedule: who is there at which time of day, what topics are open (the library has Darcy alone; the bakery has gossip), and small place-only mechanics (a whisper, a discovery, a consequence trigger). If a place has no schedule or mechanic it should not be on the alpha map.
**Onur:**

### ROL-1429 — Consequences and quests outside episodes
**They ask:** How is a missed appointment configured? Is a simple pass-the-time trigger enough for alpha? Always-running loop?
**Draft:** Simple is enough for alpha: consequences are evaluated only when time passes (turn/day change), from a small table per episode (`missed` → narrative + relation deltas). No always-running loop; the map is static between turns. Quest conditions are the same table.
**Onur:**

### ROL-1531 — Quest chip and quest log: same UI on map and in episodes?
**Draft:** Same quest log everywhere; tapping the chip opens it. From the log, a quest entry pans the map to its place (on the map) or just shows the objective (in an episode). Tugce/Meltem to design chip, log and starters; the prototype's chip is placeholder.
**Onur:**

### ROL-1532 — Trait modifier (long-press to rewrite a choice) in alpha?
**Draft:** Yes, minimal version: trait badge on a choice opens the trait card with the marked words; the rewrite itself is pre-authored (each tagged option already carries its rewritten text). No AI rewrite in alpha.
**Onur:**

### ROL-1533 — Speech bubbles: confirm dropped for alpha
**Draft:** Confirmed: dropped. Dialogue uses the bottom box (narrative / cast-small / cast-large); bubbles remain only in the London pack.
**Onur:**

### ROL-1534 — Animated portraits and the player portrait on choices
**They ask:** Do small/large portraits and poses need animation (face swap)? Player portrait behind choices? Real relative heights?
**Draft:** Large stage portraits are animated (16-frame pose clips: idle + 2–3 expressions per character, pre-rendered, no face swap). Small dialogue portraits: static. The heroine's portrait behind the choices stays (cast-small "thinking" pose while choosing). Relative heights: yes, keep them roughly real; it is done by the sprite framing, not the engine.
**Onur:**

### ROL-1539 — Private conversation: private mode, history, table chat
**Draft:** Drop the private toggle for alpha (one history per NPC, the NPC remembers). No browsable chat history in alpha. The table chat inside episodes is the same feature (same engine, same history), just opened from a scene.
**Onur:**

### ROL-1540 — Map encounters: pre-scripted or AI, and do they matter?
**Draft:** Pre-scripted (whispers.json), two choices, and they do matter lightly: each option can carry a relation delta or set a flag that a later episode reads. The "…" pin means an encounter is waiting; the portrait pin means the NPC is at that place and can be visited.
**Onur:**

### ROL-1542 — Short stories: feed vs street view, unlock and buttons
**Draft:** One source, two views: the street view is the "home" of short stories; the map rail feed is a shortcut to the same list. Cut the feed for alpha if it costs time. Unlock: by day (new story each day) and by episode flags. Play = read it; Like = counts for later; Share = out of alpha.
**Onur:**

### ROL-1543 — Timed exclusive episodes: real time?
**They ask:** Countdown is real time but the game only knows morning/evening/day. Closing the app? Nobody chooses? Required for progress?
**Draft:** Game time, not real time: the choice expires when the day passes (pass the time), never by wall clock. If nobody chooses, both expire and their consequences fire. An exclusive episode is never required for main-line progress.
**Onur:**

### ROL-1544 — Is exploration mode in alpha?
**They ask:** Needs editor node, hotspot tools, timings, consequences, client mini-game. What can hotspots do?
**Draft:** Yes for alpha, in its current shape: a `(Look:)` block with spots; each spot plays authored lines and a 3-option choice with `[trait:]` tags and normal mechanics (Relation/Discovery/IfLooked). Timer = an NPC approaching; skip allowed. Editor support = plain text (the block syntax), no visual tool for alpha. Priority: below suitor detail, above places.
**Onur:**

### ROL-1545 — Location unlock: same every time or customised?
**Draft:** Customised text (who invited you, why) on the same card template; the full-screen reveal video only for the season's key locations (Netherfield, Rosings, Brighton). Other locations use the build time-lapse tile on the map (locked = empty plot, unlock = construction clip) — prototype in docs/proto-map-tiles.html.
**Onur:**

### ROL-1427 — "Stay" wording in Pass the Time
**Draft:** Agree: replace "Stay" with the universal back/cancel (top-left arrow + "Not now").
**Onur:**

## Bugs found in the prototype

### ROL-1351 / ROL-1430 / ROL-1547 — Issues found in Onur's prototype (parts 1–3)
**Draft:** These are prototype bugs, not decisions; most are known and several are already fixed in the current build (portrait/switch-character, Netherfield "Continue", speech bubbles, Assembly restart on Continue, Retake wording, V1 badge). I will answer with a checklist: fixed / will fix / by design, item by item.
**Onur:**
