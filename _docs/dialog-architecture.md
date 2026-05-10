# Dialog Architecture (v2)

This is the canonical reference for how a dialog screen is composed in
roles.ai. Every dialog beat — every line a player taps through — sits
inside a stack of three layers, optionally with named effect and
transition packages applied between renders.

The script DSL exposes one short directive per layer. A beat that
reuses the previous beat's stack writes only the dialog text.

---

## Three layers, top to bottom

```
┌─────────────────────────────────┐  3. Dialog UI
│  speech bubbles, dialog box,    │     (one of 8 types)
│  multi-select panel, etc        │
├─────────────────────────────────┤
│  effect overlay                 │  2. Effect package
│  (video, blur, tint, etc)       │     (named preset, optional)
├─────────────────────────────────┤  1. Background
│  cutscene image / video         │     (explore OR cutscene)
│  OR explore scene with hotspots │
└─────────────────────────────────┘
```

---

## Layer 1 — Background

Two flavors, mutually exclusive.

| Type     | Directive                 | When to use                                       |
|----------|---------------------------|---------------------------------------------------|
| explore  | `[bg:explore]`            | Interactive scene with hotspots the player taps   |
| cutscene | `[bg:cutscene=<asset>]`   | Custom frame (image OR video, full bleed)         |

Asset path is resolved against the current world's `cutscenes/` folder.
For `bg:explore` the engine renders the explore scene from the location
config (no asset arg).

---

## Layer 2 — Effect package (`fx:`)

Named preset combining one or more visual treatments. Defined in
`_config/fx-presets.json`. The script references a package by name
only — implementation lives in the registry.

```
[fx:fx1]            // pulls fx1 from the registry
[fx:none]           // disable any active effect
```

A preset can compose several treatments (overlay video + CSS blur +
tint, etc). See `_config/fx-presets.json` for current packages.

---

## Layer 3 — Dialog UI (`ui:`)

Eight UI styles. The directive picks which one renders for the
following beats.

| Directive            | Description                                       |
|----------------------|---------------------------------------------------|
| `[ui:narrative]`     | Off-screen narrator. Compact gradient strip.      |
| `[ui:cast-large]`    | Lead/NPC at full body, dialog box below.          |
| `[ui:inner-large]`   | Inner voice at full body, aura, dialog box.       |
| `[ui:cast-small]`    | Cast avatar in bottom-left corner + line beside.  |
| `[ui:inner-small]`   | Inner voice in bottom-left + line beside.         |
| `[ui:multi]`         | Multi-select choice panel (buttons).              |
| `[ui:write]`         | Write-your-own text input.                        |
| `[ui:bubble]`        | Speech bubble pinned over a character's head.     |

---

## Transitions (`tr:`)

Named animation package describing how the new beat enters relative to
the previous one. Defined in `_config/tr-presets.json`.

```
[tr:fadeUp]         // CSS fade-in + translateY
[tr:charSwap]       // sequence: char exits, new enters, bg pans
[tr:none]           // hard cut
```

Transitions can be:
- **css** — single keyframe-like animation on a target element
- **sequence** — multiple steps with optional delays, optional looping

See `_config/tr-presets.json` for current packages and step syntax.

---

## Inheritance — beats reuse the previous stack

A beat that omits a directive **inherits** that layer from the prior
beat. Only changes need to be written.

```
[bg:cutscene=joy-street.jpg] [fx:fx1] [tr:fadeUp] [ui:cast-large]
Joy: Hey, stranger.
Boy: Joy, didn't see you.

[ui:inner-small] [tr:none]
Valium: Stay calm.

[bg:cutscene=her-door.jpg] [tr:softCrossfade]
Boy: I'm here.
```

In this example the inner-voice beat keeps `bg`, `fx` from above and
just changes the UI + transition. The next beat changes background,
keeps the new UI and fx, picks a softer transition.

---

## Naming conventions

- Layer directives are square-bracketed and lowercased: `[bg:...]`, `[fx:...]`, `[tr:...]`, `[ui:...]`.
- Multiple directives can sit on the same line, space-separated.
- Layer order on a line doesn't matter (engine reads them as a set).
- Preset names (the values after `:`) are camelCase or shortNames: `fx1`, `fadeUp`, `charSwap`, `cast-large`, etc.

---

## AI-generated dialog — script decides the UI

When an AI directive expands into multiple sections (e.g. (GiftScene)
splices `joy_react`, `boy_inner_pre`, `boy_react_options`,
`boy_inner_mid` from the LLM response), the SCRIPT — not the AI —
decides which UI mode each section renders in. AI returns content
only; UI is a presentation choice that lives in the script.

Per-section UI overrides go on the directive itself:

```
(GiftScene  joy_react=cast-large
            boy_inner_pre=inner-large
            boy_inner_mid=inner-small
            boy_react=multi)

(GiftClosing professor=inner-large
             filler=inner-small)
```

If a section isn't named, the engine default applies:

| Section            | Default UI    |
|--------------------|---------------|
| narrative          | narrative     |
| boy_inner_pre      | inner-large   |
| joy_react          | cast-large    |
| boy_react          | multi         |
| boy_inner_mid      | inner-large   |
| professor          | inner-large   |
| filler             | inner-large   |

The same AI exchange can be rendered very differently in two scenes —
e.g. one location uses `inner-large` for the chorus (full-body
characters), another uses `inner-small` (compact avatar in the
corner). The LLM doesn't care; only the script does.

---

## Backward compatibility

Old directives — `(Scene:foo.jpg)`, `(Object:id image=foo.png)`,
`(Choice:N)`, `(Action)`, `Narrative: ... (foo.jpg)` — continue to
work unchanged. The new bracket directives are an additive layer; old
scripts keep playing as written.

When migrating a script, update beat-by-beat. Mixed syntax in the same
script is fine during the transition.

---

## File map

- `_config/fx-presets.json` — effect packages
- `_config/tr-presets.json` — transition packages
- `_docs/dialog-architecture.md` — this document
- `dialog.html` — engine parser + renderer
