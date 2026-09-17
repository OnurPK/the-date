# "Make her you" — character reveal flow (prototype, 2026-09-17)

Karakter kartı (`#pcsel` detail) → **Make her you ✦** (`#pcsPlay`; eski play/continue = `window.pcPlayCurrent()`).

## Sıra (`pcRevealSequence`, dialog2.html pcsel modülü)
1. `revealUi(true)`: bio + footer aşağı kayar, isim/etiket söner, hero %72→%100 (arka plan baştan tam ekran ölçülü `pc-select/bg_floor.webp` = giyinme odası, sadece alt kısmı açığa çıkar). Idle klibi ölçülüp **üstten sabitlenir** (`rvLayout`), kaymaz.
2. Idle klibi son karesine kadar oynar → `heroClip('walk_away')` **aynı yerleşimde** (rvLayout) biner; ilk sunulan kare çizilince idle kaldırılır (`requestVideoFrameCallback`).
3. Zeminde "Becoming someone…" (+ dönen satırlar), perde kapanır (`pc-select/fx/curtain_close.webm`, yukarıdan süzülerek gelir).
4. Perde kapalıyken `entranceClip`: `characters/<portrait>/you/entrance.webm` yürüyüşle aynı yerleşimde kurulur, 2 kare oynatılıp **durdurulur**, görünür yapılır, eski klipler silinir (geçiş görünmez).
5. Perde açılır (`curtain_open.webm`, son 1.5 sn yukarı süzülüp solar); açılışın 2.0 sn'sinde giriş klibi oynar (uzaktan gelir, yelpaze, bakış).
6. `revealDone`: "<İsim> — as you." + "Play as this character →".

## Videolar
- Üretim: Higgsfield (web), yeşil ekran #00B140, start/end frame `_mockups/` altında (`arabella_greenscreen_start/far_end`, `you_far_green/you_close_green`, `curtain_open/closed_green_v2`).
- Keyleme: ffmpeg `chromakey=0x00AF3A:0.13:0.06, despill, premultiply` → VP9 **alfa** webm (`-c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0`). **Reverse için kaynak mp4 kullan** (webm'den okurken ffmpeg alfayı düşürür → opak siyah).
- Safari alfa-webm oynatmaz → statik sprite kalır.
- Alfa kliplerin ilk karesi Chrome'da bir tik opak basılabilir → görünürlük her zaman 2. sunulan kareden sonra.

## Face swap
- gpt-image-2.5 Sunburst edit: ref = yeşil sprite + fotoğraf; çıktı yeşil → keylenir → `characters/<pc>/you/pride.png` (gitignore'da).
- Sunucu `gen-asset` artık `transparent:true` ile doğrudan şeffaf PNG de verir (restart sonrası).

## Yapılacak
- Fotoğraf yükleme adımı + canlı üretim (perde kapalıyken), iptal/yeniden dene, Safari fallback (HEVC-alpha .mov).
