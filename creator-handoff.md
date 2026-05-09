# Creator App Handoff

This document captures everything decided in a long Cowork mode session
about a node-based content editor we started building. Paste it into a
new Claude session as the first message and the new model should be
able to pick up without re-asking everything.

---

## 1. Who & what

**User**: Onur (onur@philosopherking.ai). Non-technical product designer.
Prefers Turkish for chat, English for code. Likes concrete options over
open-ended questions, hates wall-of-text. Pushes back on bad UX.
Honesty about trade-offs > false confidence.

**Project**: A creator app for **roles.ai** — a narrative game engine.
roles.ai (formerly "The Date") is an iOS-style visual novel: worlds
contain locations, locations host episodes, episodes are scripted
conversations with branching choices, cutscenes, explore segments,
inner-voice mechanics, and a closing music/dashboard recap.

Game engine ships as a single-file `dialog.html` (~21k lines) reading
plain-text scripts (`main.txt`) per location. Two worlds shipped today:
`london` and `1984`. Cloudflare Worker handles AI portrait generation.

**The new app being designed**: A creator suite — small admin team
authors episodes through a visual node graph. Think *ComfyUI for
narrative*. Single-source-of-truth replaces the legacy `main.txt` DSL.

---

## 2. Decisions made (quick reference)

| Question | Decision |
|---|---|
| Audience | Small admin team. Creator economy is V3+, not V1. |
| Format strategy | **Graph is the runtime source of truth.** Engine reads JSON directly. Old `main.txt` files migrate once, then deleted. |
| Node granularity | **Container model.** A node holds an ordered list of sub-items: dialog lines, cutscene, choice, explore. Maximum flexibility per node. |
| Branching | Edges can converge (router) OR fan out to separate endings — both supported. |
| State / variables | V2 problem. V1 only: linear flow + simple choices + branching via `IfChoice` mapping. |
| Asset & cast integration | Deeply integrated. Creator uploads images, voices, characters, venues — all from inside the editor. |
| Live preview | Critical from day 1. Editor's right pane = `dialog.html` iframe with "Play from this node" trigger. |
| Persistence | **Cloud (Cloudflare D1 + R2)**. localStorage for v0.1 prototype only. |
| Auth | Cloudflare Access whitelist (just emails for now). |
| Multi-user | V2. v0.1 is single-user. |
| Comments / track changes | Out of scope for V1. |
| Mobile editor | Out of scope. Desktop-only. |
| Hierarchy model | **Westworld**: World contains Locations contain Episodes. Episodes don't cross worlds. A *Character* can appear across worlds in different *Appearances* (kılık). |

---

## 3. Data model

```
World            (london / 1984 / istanbul / …)
├── id, name, mapImage, weatherSettings
├── Location     (bigben, herplace, safehouse, …)
│   ├── id, worldId (FK), title, kind, cover, description
│   ├── coords {x, y}            ← position on world map
│   ├── unlockPrice (optional)
│   └── Episode  (the-knock, the-couch, …)
│       ├── id, locationId (FK), title
│       ├── script_graph         ← React Flow JSON
│       └── Cast
│           └── { roleId, characterId }    ← who plays Girl/Boy/etc.

Character        (iris / liam / you / panam / shiv / …)
├── id, name, bio, age, sign
├── default_avatar
└── Appearance   (per-world look — different "kılık")
    └── { worldId, image_url, body_aspect }

Voice            (eros / valium / V / Morpheus / …)
├── id, characterId (FK to whose voice this is — you, iris, store-bought)
├── worldId       (which pack the voice lives in)
└── name, description, portrait_image, accent_color
```

A character can show up in multiple worlds wearing different
Appearances. Voices are per-character per-world.

---

## 4. Node graph — design

### Node types (V1)

5 node types as visual cards on the React Flow canvas:

1. **Beat** — container for a sequence of dialog/narrative lines
   (and optionally a Scene/cutscene reference inline). The most
   common node; an episode is mostly a chain of these.
2. **Choice** — branch point. N options, N outgoing edges.
3. **Cutscene** — full-screen image moment with optional caption line.
4. **Explore** — interactive sub-scene with N tappable Objects.
5. **Music / End** — terminal node, triggers the closing reel +
   dashboard.

Each node renders a card; click → Inspector pane on right edits its
fields. Drag node-handle to another node = create an edge.

### Edge semantics

Standard graph traversal: engine starts at a "start" node,
walks edges in order, hands control to the player at Choice nodes.
Choices can converge back to a single node (so most paths share
common downstream content) or fan out to separate endings.

### Container philosophy

A Beat node is NOT one line per node — it's a container of N
sub-items rendered inline. So a "knock at the door" beat (3
narrative lines + 2 dialog lines + 1 cutscene reference) lives in
ONE node on the canvas. Keeps graph tidy. Inspector lets you
add/reorder/edit sub-items.

---

## 5. Architecture (Cloudflare-only)

```
[Creator (browser)]
    │
    │ HTTPS (auth: Cloudflare Access)
    ▼
[Cloudflare Pages] ─── creator.roles.ai (React + React Flow)
    │
    │ fetch()
    ▼
[Cloudflare Worker] ─── api.roles.ai
    ├──→ [D1] worlds / locations / episodes / characters / voices / casts
    └──→ [R2] images, audio, video, character portraits, voice portraits

[Player (browser)]
    │
    ▼
[Cloudflare Pages] ─── roles.ai (existing dialog.html)
    │
    │ fetch episode + asset URLs
    ▼
[same Worker API]
```

Single ecosystem, single auth. Free tier covers small-team usage.
Existing `thedate-portrait.onur-377.workers.dev` Worker stays for
AI portrait pipeline, gets `/og-image` and `/dress` endpoints later.

---

## 6. MVP plan (6 sprints, ~6 weeks)

| Sprint | Goal | Status |
|---|---|---|
| 1 | Cloudflare Pages + Workers + D1 + R2 + Access skeleton, "Hello" deploy | not started |
| 2 | World/Location/Episode CRUD via API (no fancy editor yet) | not started |
| 3 | Cast & Voice manager UI; R2 asset upload | not started |
| 4 | **Node graph editor** with 5 node types | partial — see §7 |
| 5 | Live preview iframe + "Play from here" | partial — iframe wired |
| 6 | Engine upgrade: `dialog.html` reads episode JSON from API; migrate existing 2 episodes | not started |

V2: state/variables/conditionals, multi-user collab (Yjs), comment
nodes, version history, localization, creator economy.

---

## 7. What was actually built (creator.html v0.1)

A standalone single-file React app, no build step. Loads via CDN
(esm.sh import map + htm + ReactFlow 11). Located at
`creator.html` (project root).

**Working today:**

- 3-pane layout: tree sidebar (280px) | ReactFlow canvas | right
  rail with Inspector + Live Preview iframe (380px).
- Sidebar tabs: World tree, Cast, Voices, Assets.
- World/Location/Episode tree with twirl-down. + buttons to add a
  new world, location, or episode.
- ReactFlow canvas with 6 custom node types: Beat, Choice, Cutscene,
  Explore, Music, End. Each rendered as a colored card with header,
  title, body preview. Drag/connect/select work.
- Toolbar above canvas: + Beat / + Choice / + Cutscene / + Explore /
  + Music / + End. Clicking inserts a node at random position.
- Inspector (right top): shows the selected node's editable fields.
  - Beat: title + line list (speaker dropdown + textarea).
  - Choice: prompt + options.
  - Cutscene: title + image URL + caption.
  - Explore: title + duration + comma-separated object IDs.
  - Music/End: title only.
  - Delete-node button at the bottom.
- Live Preview (right bottom): iframe to `dialog.html?noredirect=1`.
  Reload button.
- localStorage persistence (auto-save every change, "Saved" flash
  in topbar).
- Export-as-JSON button for the active episode.
- Reset-to-defaults button.
- Pre-populated default data: 2 worlds, 9 locations, 2 sample
  episodes (`the-knock` for `herplace`, `the-room` for `safehouse`),
  6 characters, 8 voices.

**Doesn't work yet (intentional gaps for v0.2+):**

- Engine doesn't read graph JSON — preview iframe still runs the
  legacy `main.txt`-based engine. Editing nodes does not affect what
  Live Preview plays. Only structural / visual editing today.
- No "Play from this node" wire-up.
- No asset upload UI; you paste URLs by hand into node fields.
- No backend — all data in localStorage.
- No multi-user, no auth.
- Cast/Voices tabs render but you can't add/edit characters or
  voices yet.
- No World/Location editing screens (only basic prompt-on-creation).
- No undo/redo. No keyboard shortcuts.
- No migration from existing `main.txt` files.

---

## 8. Open questions before V2

1. **Worker / D1 schema** — do we model with one big `entities` table
   keyed by type, or separate tables per entity? Separate tables
   probably cleaner for D1's relational primitives.

2. **R2 asset addressing** — public buckets via custom domain, or
   private bucket + signed URLs through Worker? Public is simpler;
   signed protects unpublished content.

3. **Engine upgrade strategy** — flag-gated rollout (legacy +
   new side-by-side) or hard cutover? Probably flag-gated until
   migration is fully validated on both worlds.

4. **Node-level conditionals** — are these a NEW node type or a
   property on edges? UX-wise edges-as-conditions are subtler;
   nodes-as-conditions clearer for non-technical creators.

5. **State / variable namespace** — episode-local or session-global?
   Existing engine has both (`relationshipScore` is session,
   `discovery` flags are character-bound). Editor needs to expose
   both kinds.

6. **Live preview scope** — single-episode quick play vs. full game
   walkthrough (intro → casting → map → episode). User said they
   want both. Default to single-episode for speed.

---

## 9. How to communicate with this user

- **Language**: Turkish for conversation. English for code, file
  names, technical terms.
- **Format**: short paragraphs, NOT bullet hell. Inline emphasis is
  fine but no headers stacked on top of headers.
- **Decisions**: present 2-3 options with trade-offs, then state
  your recommendation. Don't dump 10 questions at once.
- **Code**: prefers single-file solutions for prototypes, reactive
  to "just make it work first, polish later". Push back if
  short-term hack will hurt long-term.
- **No emojis** unless the user uses them first. No corporate
  cheerleader tone. Honest about what's hacky.
- **Mistakes**: own them, fix them, don't apologize 3 times.

---

## 10. First message for the new session

Suggested opening to paste:

> Selam! Yeni bir creator app projesine başlıyorum. Önceki
> sohbetimizden bir handoff dokümanım var, onu yapıştırıyorum.
> Bu dokümandaki § 6 (MVP plan) ve § 8 (open questions) üzerinden
> ilerlemek istiyorum. § 7'deki creator.html v0.1 iskeleti elimde,
> oradan devam edebiliriz veya istersen sıfırdan Cloudflare backend'i
> kurmaya başlayalım. Önerin nedir?
>
> [paste this entire handoff document below]

---

*End of handoff. Last updated during session that ended with
creator.html v0.1 deployed to localStorage prototype state.*
