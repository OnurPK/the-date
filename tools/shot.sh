#!/bin/zsh
# Simülatörden ekran görüntüsü → _shots/<ad>.png (Claude bu klasörü okur)
#   zsh tools/shot.sh kart-ekrani
cd "$(dirname "$0")/.."
mkdir -p _shots
name="${1:-shot-$(date +%H%M%S)}"
xcrun simctl io booted screenshot "_shots/$name.png" >/dev/null && echo "✓ _shots/$name.png"
