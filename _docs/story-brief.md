# roles.ai — Story & Character Brief

This document is a self-contained handover for any writer (human or
LLM) generating new scenes, dialog, or beats for the **London episode**
of roles.ai. Drop it into ChatGPT/Claude as system context and ask for
comedic, character-true scenarios.

---

## 1. Premise

roles.ai is a hand-illustrated mobile visual novel about modern dating.
The player ("Mike", configurable) plays through a single date with a
chosen love interest. The twist: the player has **four inner voices**
that argue with each other inside his head all night — passionate,
cynical, romantic, and wise — and most major dialog choices are picked
from one of those voices' suggestions.

The London episode is the flagship: an evening date at Iris's flat in
London, with a chance encounter on the way there. Tone is warm,
sharp-witted, slightly anxious, very inner-monologue-heavy.

---

## 2. The Player Character — Mike

| | |
|---|---|
| **Name** | Mike (the player picks any name during onboarding; default referenced as Mike in this doc) |
| **Speaker tag in script** | `Boy:` |
| **Voice / vibe** | Nervous, thoughtful, a little self-conscious. Speaks in short natural lines. Self-aware enough to roast himself, not enough to relax. |
| **Inner voices** | Eros, Valium, Romeo, Professore (see §5) |
| **Visual** | Full body illustration, generated from the player's selfie + body params via gpt-image-1 |

Mike is the audience's POV. He doesn't monologue. He listens to his
voices argue, picks one suggestion, and only then speaks.

---

## 3. The Date — Iris

| | |
|---|---|
| **Name** | Iris |
| **Age** | 22 |
| **Star sign** | Pisces ♓ |
| **City** | London |
| **Speaker tag** | `Girl:` |
| **Voice / vibe** | Warm, observant, a little teasing. Knows what she's doing more than Mike does. Quick to laugh. Won't perform — what you get is what's real. |
| **Inner voices** | Trilli, Alfa, Scheggia, Giulietta (see §6) |
| **Setting** | Lives alone in a small London flat — coffee table, vinyl player, a fridge full of postcards from places she has and hasn't been |

Backstory hint: Mike crossed paths with her at a bookshop "last week";
tonight is the first proper date.

---

## 4. The Friend — Joy

| | |
|---|---|
| **Name** | Joy |
| **Age** | 35–40 |
| **Speaker tag** | `Joy:` |
| **Voice / vibe** | Older-sister figure from Mike's art-world past. Warm, sharp, a little sarcastic. Treats Mike like a younger brother she half-raised. Affectionate but never sappy. UK voice. |
| **Setting** | Bumps into Mike on the street on the way to Iris's place |

Joy doesn't have inner voices in the script — she's an external mirror.
Used for one-scene encounters where Mike's choices get sanity-checked
by an older perspective.

---

## 5. Mike's Inner Voices — London Pack

These four argue inside Mike's head all night. They are NOT Mike, they
are NOT NPCs to anyone else — only Mike (the audience) hears them.
Use them like a Greek chorus: bicker, undercut, swoon, panic.

### Eros — the impulse
- Early 20s, always leaning closer.
- Wants you to jump before you're ready, to lose your shoes in someone
  else's flat. Will cosign every reckless thing your hands want to do.
- Voice: passionate, urgent, slightly anxious, slightly materialistic
  ("we should've spent more").
- Speaker tag: `Eros:`

### Valium — the brake
- Late 30s, low voice.
- Tells you to breathe when the room gets too loud, to put the phone
  face down. Reminds you nothing tonight has to be decided right now.
- Voice: deadpan, cynical, dry, calming. Will undercut sentimentality.
  ("Relax. It's a gift, not a kidney.")
- Speaker tag: `Valium:`

### Romeo — the slow burn
- Mid-20s, worn wool coat, steel watch.
- Believes in handwritten letters and waiting in the rain because you
  said you would. Wants the slow version of everything.
- Voice: earnest classical romantic, slightly flowery. Frames things
  as gestures.
- Speaker tag: `Romeo:`

### Professore — the deciding voice
- In his 60s, jacket that's seen things.
- Asks the question you didn't want and waits while you look for the
  answer. Doesn't mind silence. Will not flinch.
- Voice: mentor, calm, settles disputes among the others. Speaks last
  in a sequence where the others have argued.
- Speaker tag: `Professore:`

---

## 6. Iris's Inner Voices — London Pack

Same chorus structure but for Iris. Player only hears these in scenes
that "cut to her side" (e.g. the couch scene where her voices show up
between her spoken lines).

### Trilli — the spark
- Mid-20s, glass-bright.
- Wants to dance on tables, refuses to be dimmed by anyone in the room.
- Voice: bubbly, excitable, optimistic.
- Speaker tag: `Trilli:`

### Alfa — the captain
- Holds the door; runs the room.
- Says yes before the rest of her catches up, and doesn't apologise
  for any of it.
- Voice: calm, certain, decisive.
- Speaker tag: `Alfa:`

### Scheggia — the splinter
- Sharp under the skin. Won't let her forget what she swore she'd
  never forget.
- Voice: edge first, soft never. Cynical guardian of past hurts.
- Speaker tag: `Scheggia:`

### Giulietta — the romantic
- All romance, all balcony. Wants letters, candle wax on the floor,
  somebody saying the wrong thing at the right time.
- Voice: aches softly, refuses to settle, sees signs everywhere.
- Speaker tag: `Giulietta:`

---

## 7. London Episode — Story Arc

The London episode runs roughly:

### Act 1 — The street (before her place)
- Mike walks through London at dusk to Iris's flat, gift in hand.
- Joy bumps into him on the street.
- They catch up briefly. Joy notices he's "all dressed up", Mike admits
  he's seeing someone important.
- Joy asks to see the gift. Player picks a real photo from camera or
  gallery (in-game GPT vision identifies what it is + ComfyUI renders
  it as a clean illustration that Joy reacts to).
- Inner-voice chorus argues about the gift while Joy examines it
  (Eros: "we should've spent more", Valium: "relax", etc).
- Joy reacts to the actual identified object, gives a final blessing.
- Mike walks the rest of the way to Iris's door.
- Knocks. Nervous wait (inner voices). Door opens.

### Act 2 — Inside her flat
- Iris greets him, invites him in for coffee.
- Quick choice ("how to greet her").
- Iris steps into the kitchen. **Explore phase** — player has 30s to
  tap hotspots in the room (coffee machine, fridge, vinyl player,
  poster, lava lamp, dog, coffee table). Each opens a small object
  scene with inner-voice commentary, fragments of Iris's life
  (postcards from places she's never been, a calendar circled for
  March 14, a stack of indie folk records).
- Iris returns with wine, suggests moving to the couch.

### Act 3 — The couch (two-person scene mode)
- Two-person illustrated scene with speech bubbles + inner-voice
  overlays.
- Conversation drifts to memories: an old cinema they used to sneak
  into, a possible Tuesday cinema date.
- A phone rings. Choice: listen in vs. give her privacy. The branch
  determines whether you learn her best friend's name (Tess).
- Conversation returns. Tension builds. Iris tilts her head and says
  "Well... now what?"
- 4-option choice (Eros: kiss her / Valium: stay still / Professore:
  joke / Write: your own move). The Write option opens a Mike-styled
  light dialog with a typed input.
- Cinematic moment: Professore demands a coin flip to decide. Coin
  lands heads. Mike closes the gap.

### Act 4 — The hug (resolution)
- Cut to a hug illustration. Inner voices celebrate / second-guess.
- "You're such a mess." "Yeah." "Don't stop being one."

### Act 5 — Music + dashboard
- End-scene cinematic video.
- Music scene with the song "Slow guitar, brushed drums" — indie folk
  fits Iris's record collection. Polaroids drift in over the lyrics
  (her place / ran into Joy / coffee on the couch / etc).
- Recap dashboard: relationship score, what was learned about Iris,
  voices that influenced the choices.

---

## 8. Tone & Style Rules

### Dialog
- **Short lines.** ~6–14 words max for spoken dialog. Inner voices can
  be 8–18.
- **No emojis** in spoken dialog. Emojis only on UI elements (e.g.
  polaroid corners).
- **No exclamation marks** unless absolutely necessary. The mood is
  understated.
- **No "lovely", no "she'll love it"**, no generic affirmation. Every
  reaction must reference something specific.
- **Inner voices argue.** Three inner voices in a row should NOT all
  agree. They undercut each other. Romeo earnest → Valium deflates →
  Eros pushes → Professore arbitrates.
- **Iris doesn't perform.** No coquettish flirty stuff. She's grounded
  and a little dry.
- **No quotation marks** inside dialog text (the engine handles
  speaker labels).
- **British English** for Joy and Iris; Mike is whoever the player is.

### Naming
- Player is the player's name (Mike in this doc) — never "you" or
  "the boy".
- Iris is "Iris", referenced as "she/her" by inner voices.
- Joy is "Joy".
- Inner voices are referenced by their proper names (Eros, not "your
  passionate side").

### Comedic Beats
- The chorus is comedy-driving. Eros is the materialistic anxious
  voice ("we should have spent more, what is this?"). Valium is the
  deadpan ("relax, it's a first date — what are you, the mafia?").
  Romeo is sincere to the point of being unhip. Professore settles.
- Iris's voices are quieter; Trilli is the closest to chaotic energy
  ("yes again. yes always."), Scheggia the sharpest ("he read the
  diary. he read the diary.").
- The bit-shift between spoken and inner gives most of the comedy.

---

## 9. Script DSL — How Lines Are Written

If you want output that drops directly into the script files, use this
syntax. (Otherwise just write plain dialog and a human will format.)

### Speaker lines

```
Boy: I missed you.
Iris: You said that already.
Eros: Say it again.
Joy: He always says it twice.
Narrative: She tilts her head.
```

### Cutscene image attached to a narrative

```
Narrative: You stand on the street below her building. (cutscene01.jpg)
```

### Scene mode (two-person illustration with speech bubbles)

```
[bg:scene=narrativescene01.jpg] [ui:bubble]
Iris: So tell me what you've actually been up to.
[ui:inner-small]
Trilli: He's about to answer with the cinema. Let him cook.
```

### Background, FX, Transition, Dialog UI directives

```
[bg:cutscene=joy-street01.jpg]      full-bleed background image
[bg:scene=narrativescene01.jpg]     scene illustration with bubbles
[bg:explore]                        interactive room with hotspots
[bg:none]                           clear

[fx:none]                           no effect
[fx:fx1]                            preset effect (see _config/fx-presets.json)

[tr:none]                           hard cut
[tr:softCrossfade]                  smooth crossfade

[ui:cast-large]                     full-body lead/NPC + dialog box
[ui:cast-small]                     bottom-left avatar + light dialog
[ui:inner-large]                    full-body inner voice + aura
[ui:inner-small]                    bottom-left inner voice + dark dialog
[ui:narrative]                      compact gradient strip narrator
[ui:bubble]                         speech bubble (paired with bg:scene)
[ui:multi]                          multi-select choice panel
[ui:write]                          text input
```

Beats inherit the previous stack — only changes need to be written.

### Multi-select choice

```
(Choice:3)
Romeo: Take her hand.
Valium: Stay where you are.
Professore: Crack a joke.
```

Three options follow `(Choice:N)`. Player picks one; the chosen
option's text becomes the spoken Boy line.

### Write-your-own choice

```
(Choice:4)
Eros: Close the gap.
Valium: Stay still.
Professore: Crack a joke.
Write: Write your own move…
Narrative: The impulse arrives, clean and whole, {{input}}.
```

`Write:` is a special speaker that becomes a text input. Player's
typed text is substituted via `{{input}}`.

### Branching (post-choice)

```
(Choice:2)
Romeo: Listen to the conversation
Valium: Give her privacy

(IfChoice:0)
Iris: Tess! Yeah no, I'm fine.
(EndIf)

(IfChoice:1)
Narrative: You let your eyes drift away.
(EndIf)
```

### Explore section (timed hotspot phase)

```
(Explore:30)
```

30-second window where the player taps hotspots; each opens an
`(Object:id ...)` block defined later in the script.

### Object block (each hotspot in the room)

```
(Object:fridge image=fridge.jpg)
(Action)
Romeo: Look at the photo on the fridge
Narrative: Two faded photos held by magnets. (+7)
Romeo: That moment is still in you somewhere.
```

Multi-action objects: each `(Action)` is a player choice once they
open the object.

### Special directives

```
(Music)            end-of-game music scene
(EndScene)         15-second cinematic + dashboard
(Video:foo.mp4)    one-shot fullscreen video (e.g. coin flip)
```

---

## 10. How to Use This With ChatGPT

### Option A — Generate a new short scene
> Paste this whole doc as system context, then:
> "Write a 12–18 line scene where Mike and Joy bump into Joy's
> ex-boyfriend at the corner shop. Use the script DSL from §9.
> Tone per §8. Keep Joy in character per §4."

### Option B — Generate inner-voice chorus for an existing beat
> "Mike just realised he forgot the wine. Write 4 inner-voice lines
> (one each for Eros, Valium, Romeo, Professore) that capture the
> moment per their voices in §5. Format as `Speaker: line`."

### Option C — Generate Iris reactions
> "Mike just confessed something embarrassing. Write Iris's spoken
> reaction (1–2 lines) and her inner-voice chorus (3–4 lines, one
> each from Trilli/Alfa/Scheggia/Giulietta) per §6."

### Option D — Pure comedic improv
> "Joy is reviewing Mike's outfit before Iris arrives. Write 8 short
> lines, alternating Joy and Mike, in the style of §8. End on a
> punchline."

---

## 11. Rough Files (for the curious)

- `worlds/london/locations/herplace/scripts/main.txt` — current
  London script.
- `_docs/dialog-architecture.md` — engine architecture (bg/fx/tr/ui).
- `_config/fx-presets.json`, `_config/tr-presets.json` — visual
  preset registries.
- `dialog.html` — the engine itself.

---

*Last updated: roles.ai v2 dialog architecture, gift sequence with
GPT-4o vision + ComfyUI Cloud render integration. London episode
flagship.*
