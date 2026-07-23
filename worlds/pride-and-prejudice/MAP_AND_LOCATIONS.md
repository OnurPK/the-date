# Pride & Prejudice — world MAP + locations

Match the London map's look: a **detailed isometric / bird's-eye illustrated map**, tiny hand-painted
buildings, emphasised landmarks, day + night variants, ~3:2 (1536×1024). London is a dense city;
ours is **Regency Hertfordshire countryside** — fields, lanes, a village, scattered great houses.

## MAP PROMPT — day  (`worlds/pride-and-prejudice/map.jpg`)
> A detailed isometric bird's-eye illustrated map of a Regency English county (Hertfordshire),
> hand-painted storybook style, tiny intricate buildings, rolling green fields and hedgerows,
> winding country lanes and a little river with stone bridges, scattered across it a few named
> estates: a **grand lit Georgian hall** (Netherfield) with a formal garden; a **modest brick
> manor** (Longbourn); a **small country house** (Lucas Lodge); a **village** with an assembly
> hall, church spire and market street (Meryton); and, far at the edges, two larger distant
> estates half-veiled in mist. Warm saturated daylight, gilt compass rose, aged-parchment border,
> gentle vignette. `--ar 3:2`. NEGATIVE: text labels, modern roads/cars, photorealistic, people.

## MAP PROMPT — night  (`worlds/pride-and-prejudice/map-night.jpg`)
> Same map, same composition, at night: deep blue-and-ink palette, warm amber lamplight glowing in
> the windows of the great houses and along the village street, a moon and soft mist over the
> fields, the river catching moonlight. Cosy, atmospheric. `--ar 3:2`. Same negatives.

---

## LOCATIONS on the map (3 categories)
Each is an illustrated building = a clickable pin. Category drives its state.

### 🎭 Interactive location examples  (explorable hubs, not tied to one episode)
| pin | what it is | note |
|-----|-----------|------|
| **Meryton** | the village — market street, the militia's quarters, shops, gossip | wander / mingle hub; where the officers are |
| **Longbourn** | the Bennet family home | the PC's neighbours; drawing-room / family scenes |
| **Lucas Lodge** | Sir William & Charlotte Lucas's house | Charlotte hub; smaller social calls |

### 📖 Episode related  (the-newcomer series — unlock as you progress)
| pin | episode | note |
|-----|---------|------|
| **The Assembly Rooms** (Meryton) | `the_assembly` (ep 1) | where Darcy first calls her "tolerable" |
| **Netherfield** | `netherfield` (ep 2) + **`the_netherfield_ball`** (ep 3 — built) | Bingley's hall; our ball lives here |

### 🔒 From the book, LOCKED  (canon places, open in later chapters)
| pin | what it is | unlocks |
|-----|-----------|---------|
| **Pemberley** | Darcy's great estate in Derbyshire | far later — the turn of the whole story |
| **Rosings Park + Hunsford** | Lady Catherine de Bourgh's seat + Mr Collins's parsonage | mid-story (the proposal chapter) |

> Shown as **locked** on the map (dimmed / a small padlock / mist-veiled at the far edges) so the
> player sees the world is bigger than what's open yet — a promise of what's coming.

---

## How the map is used (design note)
- Map = the **location-select / episode-select** screen (like London's `map.jpg`).
- Interactive pins → open that location's explore/backgrounds. Episode pins → launch the episode.
- Locked pins → dimmed + padlock, unlock when their required episodes are done (`requires` in the
  episode JSONs already models this: e.g. the ball requires the assembly/netherfield).
- Day/night variant can reflect story time or just be a mood toggle (London ships both).
