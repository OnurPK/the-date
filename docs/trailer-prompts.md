# World cover trailer — Seedance 2.5, 15 s, reference images

Kapak alanı ("Enter a world") için sessiz, 15 sn, **9:16 dikey**, sonu siyaha fade. Metin/logo yok.

## Referanslar (`worlds/pride-and-prejudice/_mockups/trailer_refs/`) — bu sırayla yükle

| @ | dosya | ne için |
|---|-------|---------|
| @Image1 | `ref1_world_map.jpg` | dünya — havadan Hertfordshire, stil |
| @Image2 | `ref2_carriage_night.jpg` | gece yolu, at arabası — geliş |
| @Image3 | `ref3_ballroom_arrival.png` | balo salonu, kalabalık, Arabella kapıda |
| @Image4 | `ref4_arabella.png` | Arabella kimliği (yüz, saç, lacivert elbise) |
| @Image5 | `ref5_darcy.png` | Darcy kimliği (yüz, siyah frak) |
| @Image6 | `ref6_the_look.png` | ikisi karşı karşıya — "the look" |

## Prompt

```
Cinematic teaser trailer, 15 seconds, vertical 9:16, silent. Painted Regency-romance look exactly like the reference images: warm candlelit oil-painting realism, film grain, shallow depth of field, restrained elegant motion. Keep the woman's face, dark updo and deep blue gown exactly as @Image4 and the gentleman's face and black tailcoat exactly as @Image5 in every shot. No text, no captions, no logos, no watermark.

0–3s: Slow aerial push-in over the hand-painted countryside of @Image1 at golden hour, fields and hedgerows, a river, the grand hall coming into view. Hard cut.
3–5.5s: Night. A black carriage rolls along a moonlit country lane toward distant lit windows, as in @Image2; lantern swaying, hedgerows passing. Hard cut.
5.5–8s: The candlelit ballroom of @Image3: the woman (@Image4) steps through the doorway, the crowd turns, chandeliers glitter; slow dolly forward following her. Hard cut.
8–10.5s: Close-up of the woman (@Image4), one gloved hand at her collarbone; she slowly turns her head to the camera and gives a sharp, knowing half-smile, one eyebrow lifting. Hard cut.
10.5–13s: Across the room the gentleman (@Image5) stands apart from the dancers and lifts his gaze straight into the camera, cold and intense; blurred couples pass behind him. Hard cut.
13–15s: The two of them face each other on the dance floor as in @Image6, a single held look, candles flickering; then a slow fade to black, fully black on the last frame.

Smooth camera, no shake, no fast zooms, no face morphing, consistent lighting and costumes across shots, subtle natural breathing and fabric motion.
```

Negatif: `text, subtitles, letters, logo, watermark, modern clothing, cars, photoreal skin, extra fingers, face morphing, camera shake, fast zoom, flashing lights`

## Sonra
Çıkan mp4'ü ver → 9:16 kırpma kontrolü, H.264 + webm, kapağa `muted autoplay playsinline`, bitince statik kapağa çapraz geçiş.
