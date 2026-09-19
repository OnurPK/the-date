#!/bin/zsh
# iOS Simülatöründe çalıştır — Safari motoru, push gerekmez: uygulama localhost:8000'e bağlanır.
#   zsh tools/sim.sh                 (dev-server açık olmalı: node dev-server.js)
#   DEVICE="iPhone 17 Pro" zsh tools/sim.sh
# Ekran görüntüsü: zsh tools/shot.sh <ad>   → _shots/<ad>.png
set -e
cd "$(dirname "$0")/.."

# cihaz seç: DEVICE verilmişse o, yoksa en yeni "Pro Max", yoksa ilk iPhone
UDID=$(xcrun simctl list devices available -j | DEVICE="${DEVICE:-}" python3 -c '
import json,sys,os
d=json.load(sys.stdin); want=os.environ.get("DEVICE","")
devs=[x for rt,v in d["devices"].items() if "iOS" in rt for x in v if x["isAvailable"] and x["name"].startswith("iPhone")]
pick=None
if want: pick=next((x for x in devs if x["name"]==want),None)
if not pick: pick=next((x for x in reversed(devs) if "Pro Max" in x["name"]),None)
if not pick and devs: pick=devs[-1]
if not pick: sys.exit("iPhone simülatörü bulunamadı (Xcode → Settings → Components → iOS)")
print(pick["udid"]); print(pick["name"], file=sys.stderr)')
echo "▶ simülatör: $UDID"
open -b com.apple.iphonesimulator 2>/dev/null || open -a Simulator 2>/dev/null || echo "  (Simulator penceresi açılamadı; Xcode → Open Developer Tool → Simulator ile aç)"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1 || true

# uygulama paketindeki config'i geçici olarak localhost'a çevir
CFG=ios/App/App/capacitor.config.json
cp "$CFG" /tmp/cap.config.bak
python3 - "$CFG" <<'EOF'
import json,sys
p=sys.argv[1]; c=json.load(open(p))
c.setdefault("server",{})["url"]="http://localhost:8000/dialog2.html"; c["server"]["cleartext"]=True
json.dump(c,open(p,"w"),indent=2)
EOF
restore(){ cp /tmp/cap.config.bak "$CFG"; }
trap restore EXIT

echo "▶ build (Debug, simulator)"
mkdir -p ios/App/build
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug \
  -destination "id=$UDID" -derivedDataPath ios/App/build/sim \
  CODE_SIGNING_ALLOWED=NO build >ios/App/build/sim.log 2>&1 || { echo "✗ build başarısız:"; grep -E "error:" ios/App/build/sim.log | head; exit 1; }
APP=$(find ios/App/build/sim -name App.app -path "*iphonesimulator*" | head -1)
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" ai.roles.prototype >/dev/null
echo "✓ çalışıyor — ekran görüntüsü: zsh tools/shot.sh <ad>"
