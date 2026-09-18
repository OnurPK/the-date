#!/bin/zsh
# Safari için HEVC-alpha .mov üretir (Mac'te çalışır; hevc_videotoolbox gerekir).
# Kaynak: mevcut VP9-alpha .webm klipler → geometri birebir aynı kalır.
#
# ÖNEMLİ: webm'i `-c:v libvpx-vp9` ile decode etmek şart. ffmpeg'in varsayılan vp9
# decoder'ı alfa kanalını ATAR → çıkan .mov opak olur (önceki .mov'ların sorunu buydu).
#
# Kullanım:  zsh tools/make-mov.sh            (tüm klipler)
#            zsh tools/make-mov.sh path/a.webm path/b.webm   (seçili)
set -e
cd "$(dirname "$0")/.."
W=worlds/pride-and-prejudice
if [ $# -gt 0 ]; then
  files=("$@")
else
  files=(
    $W/characters/arabella_frost/idle.webm
    $W/characters/arabella_frost/idle_b.webm
    $W/characters/arabella_frost/idle_c.webm
    $W/characters/arabella_frost/walk_away.webm
    $W/characters/arabella_frost/you/entrance.webm
    $W/characters/arabella_frost/outfits/ivory.webm
    $W/characters/arabella_frost/outfits/emerald.webm
    $W/characters/arabella_frost/outfits/rose.webm
    $W/pc-select/fx/curtain_close.webm
    $W/pc-select/fx/curtain_open.webm
  )
fi
for f in "${files[@]}"; do
  out="${f%.webm}.mov"
  echo "→ $out"
  ffmpeg -y -hide_banner -loglevel error \
    -c:v libvpx-vp9 -i "$f" \
    -vf "unpremultiply=inplace=1,format=bgra" \
    -c:v hevc_videotoolbox -alpha_quality 0.9 -b:v 4M -tag:v hvc1 \
    -movflags +faststart -an "$out"
done
echo "kontrol:"; python3 tools/check-mov.py "${files[@]/%.webm/.mov}"
