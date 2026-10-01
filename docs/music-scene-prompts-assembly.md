# The Assembly — episode-end music scene · "Arabella at the pianoforte"

60 s, 9:16, episode sonu: Arabella'nın son repliği → bu klip → iris → günlük.
Omurga: Kling 3.0 first/last-frame **piyano loop**; araya **4 hayal** (Seedance 2.5, referanslı). Hayaller episode'dan bağımsız yeni içerik — her bölüm sonunda yeniden kullanılabilir.

Referanslar: `worlds/pride-and-prejudice/_mockups/cutscene_refs/`

| dosya | ne için |
|-------|---------|
| `assembly/ref_arabella_face.jpg` · `assembly/ref_arabella_identity.jpg` | Arabella kimliği (her klipte @Image1 / @Image2) |
| `assembly/ref_the_look.jpg` | ışık + renk hedefi (mum ışığı, amber, film grain) |
| `music/piano_loop_frame.png` | Kling first **ve** last frame (loop) |
| `music/m1_rain_window.png` · `m2_empty_ballroom.png` · `m3_letter_fire.png` · `m4_brighton_shore.png` | her hayalin mekân/kompozisyon referansı (Seedance'e @Image3) |

Kimlik referansları her zaman ilk sırada. Her klipte 3–4 referans yeter.

---

## 0 · Zaman çizelgesi (60 s)

| sn | kaynak | not |
|----|--------|-----|
| 0–8 | piano loop | mum, ilk cümle; 6. sn'de "bakış" (loop'un B varyantı) |
| 8–17 | **M1 yağmur** | mürekkep-leke geçişi (0.6 s) |
| 17–22 | piano loop | |
| 22–31 | **M2 boş salon** | |
| 31–35 | piano loop | |
| 35–44 | **M3 mektup** | |
| 44–48 | piano loop | |
| 48–57 | **M4 deniz** | |
| 57–60 | piano loop | son akor, mum söner (CSS karartma) → iris → günlük |

Geçiş: hayale giriş = siyah mürekkep lekesi büyüyüp kareyi yutar (`clip-path` ile inkblot mask, 0.6 s); hayalden çıkış = mum alevi titremesi (2 kare beyaz flicker + 0.4 s cross-dissolve). Hayal boyunca piyano low-pass (800 Hz) + −6 dB, dönüşte 0.5 s'de açılır.

---

## 1 · Piyano loop — Kling 3.0, first frame = last frame

First frame: `music/piano_loop_frame.png` · Last frame: **aynı dosya** · Süre: 10 s · 9:16

```

```

Negatif: `text, letters, watermark, camera movement, zoom, face morphing, extra fingers, hands leaving the keys, second person, modern clothing, fast motion`

**B varyantı — "bakış" (5 s, aynı first/last frame):**
```
Same scene, same woman, same framing, static camera. She plays softly; at the middle of the clip she lifts her eyes from the keys and looks straight into the camera for a moment, calm and unreadable, then lowers them again to the keys and returns exactly to the starting pose. Candles flicker. No text.
```

İkisi de aynı kareyle başlayıp bittiği için A→B→A kesmeleri görünmez.

---

## 2 · Hayaller — Seedance 2.5, referanslı, 9 s, sessiz

Ortak giriş (her prompt'un başı):

```
Cinematic Regency daydream, vertical 9:16, 9 seconds, silent. Painted oil-painting realism exactly like the reference images: film grain, shallow depth of field, restrained slow motion. The woman is @Image1 / @Image2 in every frame: same face, dark updo, deep blue gown, gold necklace. Composition and light of @Image3.
```

Ortak negatif: `text, subtitles, letters, logo, watermark, modern clothing, photoreal skin, extra fingers, face morphing, camera shake, fast zoom, motion blur on last frame, smile`

### M1 · `mus_m1_rain.mp4` — yağmurda pencere (korku / Darcy)
Refs: `@Image1 ref_arabella_face` · `@Image2 ref_arabella_identity` · `@Image3 music/m1_rain_window`

```
[ortak giriş]

```

### M2 · `mus_m2_ballroom.mp4` — boş salonda tek dans (yalnızlık)
Refs: `@Image1 ref_arabella_face` · `@Image2 ref_arabella_identity` · `@Image3 music/m2_empty_ballroom` · `@Image4 assembly/ref_ballroom_wide`

```
[ortak giriş]

```

### M3 · `mus_m3_letter.mp4` — mektup ve ateş (bekleyiş)
Refs: `@Image1 ref_arabella_face` · `@Image2 ref_arabella_identity` · `@Image3 music/m3_letter_fire`

```
[ortak giriş]

```

### M4 · `mus_m4_shore.mp4` — Brighton kıyısı (kaçış / Vane)
Refs: `@Image1 ref_arabella_face` · `@Image2 ref_arabella_identity` · `@Image3 music/m4_brighton_shore`

```
[ortak giriş]

```

---

## 3 · Müzik — 60 s pianoforte nocturne

ElevenLabs sound-generation (`/api/author/gen-audio`, 2×30 s, ortada 2 s crossfade) ya da tek parça Music API:

```
Solo pianoforte, early 19th-century drawing-room nocturne in A minor, 62 BPM, rubato, slightly muffled period instrument with soft felt hammers, intimate close mic, a single candle-lit room; a simple sad melody in the right hand over slow broken chords, a brief lift to the relative major in the middle, returning quieter; ends on an unresolved held chord that fades. No other instruments, no vocals, no reverb tail beyond the room.
```

Teknik: 44.1 kHz mp3, −16 LUFS; hayal segmentlerine `lowpass 800 Hz, −6 dB` otomasyonu motor tarafında (`prideAudio` filter node), dosyada değil.

---

## 4 · Post + wiring

- Seedance mp4 (720×1280) → 1080×1920 H.264 High 4.0 + sessiz AAC, `-movflags +faststart`; son kare still olarak çıkar.
- Kling loop: iki klip (A 10 s, B 5 s) aynı şekilde; A'nın son karesi = ilk karesi olduğundan `loop` attribute ile oynar, B `(Video:)` değil sahne içinde swap.
- Yeni sahne tag'i: `(Memories: piano=mus_piano_a.mp4 look=mus_piano_b.mp4 | m1,m2,m3,m4 | music=music.ballad)` — engine'de episode END'den önce tek ekran; bitince mevcut END frame → "Open diary".
- iOS: tek `<video>` elemanı, kaynak swap ile (dört video elemanı açma); hayaller `preload="none"`, sırası gelmeden 2 s önce `load()`.
