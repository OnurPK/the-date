# Arabella — 9 s idle loops (one per outfit)

Seedance 2.5 · 9 s · 9:16 · **start frame = end frame = aynı PNG** (kusursuz loop). Yeşil #00B140 sabit kalsın, kamera sabit.
Start frame'ler `worlds/pride-and-prejudice/_mockups/`:

| look | start/end frame | çıktı adı |
|------|-----------------|-----------|
| default (lacivert) | `arabella_idle_ref_green.png` | `characters/arabella_frost/idle_long_green.mp4` |
| ivory | `arabella_outfit_ivory_green.png` | `characters/arabella_frost/outfits/ivory_green.mp4` |
| emerald | `arabella_outfit_emerald_green.png` | `characters/arabella_frost/outfits/emerald_green.mp4` |
| rose | `arabella_outfit_rose_green.png` | `characters/arabella_frost/outfits/rose_green.mp4` |

Ortak kuyruk (her promptun sonuna):
> Static camera, no zoom, no pan. Flat solid green background #00B140 stays perfectly uniform the whole time; nothing else enters the frame. Painted-illustration look preserved, her face identical throughout, no morphing, no text. The last frame must match the first frame exactly (seamless loop).

## 1 · Default (lacivert) — "the appraising glance"
> A young woman in a deep blue empire-waist gown and long white gloves stands facing the camera, arms relaxed at her sides. Over 9 seconds: she breathes slowly; at 2 s she tilts her head a little and glances off to her left as if she has just heard something amusing, a faint half-smile; at 4 s one gloved hand rises to touch the pendant at her throat, then lowers; at 6 s she looks back into the camera, the smile settling into her usual composed, appraising expression; she settles back into the exact opening pose by 9 s. Subtle fabric movement, hair pins catching the light.

## 2 · Ivory — "the slow turn" (etrafında döner)
> A young woman in an ivory silk Regency gown with gold embroidery and long white gloves stands facing the camera. Over 9 seconds she makes one slow, graceful full turn on the spot: she starts turning to her right, the skirt swinging softly and the gold embroidery catching the light, shows her back with the low neckline and the gathered fabric at 4–5 s, continues turning and comes back to face the camera by 8 s, arriving in exactly the opening pose with a small satisfied breath. Elegant, unhurried, feet barely visible beneath the hem.

## 3 · Emerald — "the fan and the look"
> A young woman in a deep emerald velvet gown with black lace trim and long white gloves stands facing the camera. Over 9 seconds: at 1 s she brings a small closed black lace fan up from her side, opens it with a flick at 2 s and fans herself slowly twice, eyes half-lidded, the velvet catching the light; at 6 s she closes the fan with a snap and gives the camera a slow, knowing look over it; she lowers the fan to her side and is back in the exact opening pose by 9 s (the fan hidden in her hand against her skirt, as at the start).

## 4 · Rose — "the quiet fidget" (v2 — kahkaba yok, zoom yok)
> A young woman in a dusty-rose muslin day dress with a fitted wine-red spencer jacket and long white gloves stands facing the camera, arms relaxed at her sides. Over 9 seconds, small and unhurried: at 1.5 s she shifts her weight from one foot to the other, the skirt swaying gently; at 3 s she smooths the front of her jacket with both gloved hands, then lets them fall; at 5 s she tucks a loose curl behind her ear and glances briefly to her right with a small, closed-mouth smile; at 7 s she looks back into the camera with one eyebrow slightly lifted; she settles into the exact opening pose by 9 s. Her expression stays composed — a hint of amusement only, mouth closed, no laughing, no big movements.
> The camera is LOCKED: absolutely no zoom, no push-in, no pan, no dolly, no reframing — the framing of the first frame is kept for the entire clip. Static camera, no zoom, no pan. Flat solid green background #00B140 stays perfectly uniform the whole time; nothing else enters the frame. Painted-illustration look preserved, her face identical throughout, no morphing, no text. The last frame must match the first frame exactly (seamless loop).

## Sonra
mp4'leri ver → ben keyleyip (`chromakey` + despill + premultiply) VP9-alpha webm yapar, sahnedeki idle döngüsüne ve kıyafet swipe'ına bağlarım (`outfits/<name>.webm` = o kıyafetin idle'ı).
