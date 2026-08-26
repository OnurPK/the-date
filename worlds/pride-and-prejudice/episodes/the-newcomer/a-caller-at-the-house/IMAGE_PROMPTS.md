# Episode 1 — "A Caller at the House" · Image shot-list & prompts

Karakter figürleri bitti. Kalan görseller: **location backdrop'ları** (cast figürlerinin
önünde durduğu odalar), **cutscene'ler** (intro/outro + olay/discovery anları), ve
**aday intro backdrop'u**.

Bunlar karakterlerden farklı bir stilde: **painterly-photoreal ortam** (concept-sheet değil).
Bu yüzden referans olarak concept-sheet ref1/ref2 DEĞİL, mevcut mekân/cutscene art'ını ekle.

## Referanslar (bunları `image[]` olarak ekle)
- **Location backdrop'ları için:**
  `worlds/pride-and-prejudice/locations/netherfield-ball/backgrounds/thinning-ball.jpg`
  `worlds/pride-and-prejudice/locations/netherfield-ball/explore/ballroom.png`
- **Cutscene'ler için:**
  `worlds/pride-and-prejudice/episodes/the-newcomer/the-netherfield-ball/cutscenes/carriage-night.jpg`
  `worlds/pride-and-prejudice/episodes/the-newcomer/the-netherfield-ball/cutscenes/the-dance-set.jpg`

## Format & en-boy
Her prompt: **`[STYLE] + <sahne> + --ar … + [NEG]`**
- **Location backdrop'ları (A + C):** cast-large'da KAYDIRILACAK → geniş olmalı, **3:2 (2496×1664)**
- **Cutscene'ler (B):** tam-kare anlar, kaydırılmaz → **9:16 (1440×2560)**

### [LOCSTYLE]  (backdrop — ön/orta boş kalsın, figür oraya oturacak)
> cinematic painterly-photoreal Regency interior, England circa 1810s, warm natural light,
> rich period detail, soft shallow depth of field, an EMPTY room with the foreground and
> centre left clear (no people), evocative and inviting, gilt / blush / dark-wood / deep-green palette

### [CUTSTYLE]  (cutscene — dolu, anlatısal kare)
> cinematic painterly-photoreal illustration, Regency England circa 1810s, warm candlelit or
> daylit, dramatic soft lighting, shallow depth, romantic and atmospheric, period-accurate

### [NEG]
> text, letters, watermark, signature, modern objects, cars, power lines, distorted faces,
> distorted hands, extra limbs, cartoonish, multiple figures where not wanted

═══════════════════════════════════════════════════════════════════════
# A · LOCATION BACKDROP'LARI  (ref: netherfield rooms · 9:16)
Kayıt yeri: `worlds/pride-and-prejudice/locations/longbourn/explore/<ad>.png`

### 1. `parlour.png` — ana mekân (Tanışma, Olay 1/2/4, Uğurlama)
`[LOCSTYLE] +` a warm, genteel-but-modest English drawing room by soft morning light: a settee
and chairs drawn around a low tea table, a pianoforte in the far corner, tall windows with muslin
curtains, a small fire, homely and lived-in rather than grand; the centre of the room clear.
`--ar 9:16 + [NEG]`

### 2. `study.png` — babanın çalışma odası (Baba beat'i / kapanış varyantı)
`[LOCSTYLE] +` a cramped scholar's study, floor-to-ceiling books, a cluttered desk with papers and
a globe, a single warm lamp, a worn armchair, dust in a shaft of light; scholarly, poor, beloved;
foreground clear. `--ar 9:16 + [NEG]`

### 3. `window_nook.png` — pencere kenarı (Kapanış · "A Word Apart")
`[LOCSTYLE] +` a tall drawing-room window and a quiet alcove looking onto an autumn garden, soft
late-afternoon light, a window seat, a little private corner apart from the room; intimate and
still; foreground clear. `--ar 9:16 + [NEG]`

═══════════════════════════════════════════════════════════════════════
# B · CUTSCENE'LER  (ref: netherfield cutscenes · 9:16)
Kayıt yeri: `worlds/pride-and-prejudice/episodes/the-newcomer/a-caller-at-the-house/cutscenes/<ad>.jpg`

### 4. `arrival.jpg` — INTRO (açılış)
`[CUTSTYLE] +` a modest but handsome English country house at golden morning, a fine carriage
drawing up the gravel sweep, a maid peering from a window, quiet anticipation before a visit.
`--ar 9:16 + [NEG]`

### 5. `at_the_pianoforte.jpg` — OLAY 2 (piyano anı)
`[CUTSTYLE] +` a young woman seated at a pianoforte in a sunlit parlour, seen from behind and to
the side so her face is turned away, her hands on the keys; a gentleman stands a little apart,
listening, caught; candles and warm light. `--ar 9:16 + [NEG]`

### 6. `the_spill.jpg` — OLAY 4 (discovery: onun şefkati) ⭐
`[CUTSTYLE] +` a kind gentleman crouched on a parlour floor, gently gathering pieces of a broken
tea-cup and reassuring a small frightened housemaid in cap and apron, a fallen tray beside them,
warm daylight; a quiet act of decency. `--ar 9:16 + [NEG]`

### 7. `the_save.jpg` — OLAY 1 (annenin taşkınlığı) · opsiyonel
`[CUTSTYLE] +` an over-eager Regency matron mid-boast at a tea table, a polite gentleman listening
with faint discomfort, her clever daughter leaning in to smoothly redirect the talk; a drawing
room, warm light, social tension under good manners. `--ar 9:16 + [NEG]`

### 8. `carriage_away.jpg` — OUTRO (uğurlama)
`[CUTSTYLE] +` seen from a lit doorway at dusk, a carriage's lamps receding down a tree-lined lane,
one figure watching from the step, blue evening against warm lamplight; quiet resolve. `--ar 9:16 + [NEG]`

═══════════════════════════════════════════════════════════════════════
# C · ADAY INTRO BACKDROP'U  (aday intro ekranı — Sir Henry)
Aday intro ekranı `db.bg`'yi kullanıyor. Sir Henry'yi çerçevelemek için:
Kayıt yeri: `worlds/pride-and-prejudice/locations/ashbourne-court/cover.png` (ya da `parlour.png`'i tekrar kullan)

### 9. `ashbourne_court.png`
`[LOCSTYLE] +` a handsome, well-kept country manor at warm dusk, mellow stone and lit windows, neat
lawns and an avenue of limes, comfortable and respectable rather than showy; centre clear.
`--ar 9:16 + [NEG]`

═══════════════════════════════════════════════════════════════════════
## Özet
| # | dosya | yer | kullanım |
|---|-------|-----|----------|
| 1 | parlour.png | locations/longbourn/explore | ana oda (çoğu beat) |
| 2 | study.png | locations/longbourn/explore | baba / kapanış varyantı |
| 3 | window_nook.png | locations/longbourn/explore | Kapanış |
| 4 | arrival.jpg | episodes/.../a-caller-at-the-house/cutscenes | Intro |
| 5 | at_the_pianoforte.jpg | …/cutscenes | Olay 2 |
| 6 | the_spill.jpg | …/cutscenes | Olay 4 (discovery) ⭐ |
| 7 | the_save.jpg | …/cutscenes | Olay 1 (ops.) |
| 8 | carriage_away.jpg | …/cutscenes | Outro |
| 9 | ashbourne_court.png | locations/ashbourne-court | aday intro bg |

**Discovery'ler:** "prizes candour" = sadece metin (görsel gerekmez); "kind where no one watches" = **#6 the_spill.jpg**.

**Not:** backdrop'larda ön/orta boş kalsın (cast figürleri oraya oturuyor). Üretince bana haber ver;
`[bg:explore=…]` / `[bg:cutscene=…]` yollarını script'te bu dosya adlarına bağlarım.
