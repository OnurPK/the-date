#!/bin/zsh
# Yeni bir dünya için bu repoyu "motor + boş dünya" hâline getirir.
# Bu scripti ASLA roles-ai (P&P) klasöründe çalıştırma — yeni klonun içinde çalıştır:
#
#   git clone <roles-ai repo> high && cd high
#   git remote set-url origin <yeni High repo url>
#   zsh tools/new-world.sh high "High"
#   git add -A && git commit -m "High: engine + empty world" && git push -u origin main
#
# Ne yapar:
#   1. P&P / London / 1984 içeriğini, yedekleri, mockup ve prototipleri siler
#   2. Motor dosyalarında (dialog2.html, index.html, dev-server.js) worlds/pride-and-prejudice → worlds/<slug>
#   3. worlds/<slug>/ iskeletini kurar (theme.css, manifest, pcs.json, boş harita json'ları, ilk bölüm)
#   4. DSL know-how'ı için örnek bölümü ve üretim scriptlerini docs/engine/ altında saklar
#   5. Yeni Claude projesi için CLAUDE.md yazar
set -e
setopt null_glob 2>/dev/null || true   # zsh: eşleşmeyen joker hata vermesin
cd "$(dirname "$0")/.."

slug="${1:-high}"; title="${2:-High}"
if [[ "$(basename "$PWD")" == "roles-ai" ]]; then echo "✗ roles-ai klasöründesin — bunu yeni klonun içinde çalıştır."; exit 1; fi
if [[ -d "worlds/$slug" ]]; then echo "✗ worlds/$slug zaten var."; exit 1; fi
if [[ ! -d worlds/pride-and-prejudice ]]; then echo "✗ worlds/pride-and-prejudice bulunamadı (klon eksik mi?)"; exit 1; fi
PP=worlds/pride-and-prejudice; W="worlds/$slug"

echo "▶ 1/5 know-how kopyalanıyor → docs/engine/"
mkdir -p docs/engine/examples docs/engine/legacy-gen
cp "$PP/episodes/authored/the-assembly/scripts/main.txt" docs/engine/examples/episode-the-assembly.txt
cp "$PP/whispers.json"      docs/engine/examples/whispers.json
cp "$PP/encounters.json"    docs/engine/examples/encounters.json
cp "$PP/map-locations.json" docs/engine/examples/map-locations.json
cp "$PP/audio/voices.json"  docs/engine/examples/voices.json
cp "$PP/episodes/SEASON-1.md" docs/engine/examples/SEASON-1.md
[[ -f "$PP/episodes/authored/the-assembly/voice/directions.json" ]] && cp "$PP/episodes/authored/the-assembly/voice/directions.json" docs/engine/examples/voice-directions.json
cp "$PP/MAP_AND_LOCATIONS.md" "$PP/ENGINE_INTEGRATION.md" "$PP/PLACEMENT.md" "$PP/COVER_PROMPTS.md" docs/engine/examples/ 2>/dev/null || true
mv gen_*.py gen_*.js gen_*.jsx docs/engine/legacy-gen/ 2>/dev/null || true

echo "▶ 2/5 dünya iskeleti → $W/"
mkdir -p "$W"/{audio/{amb,music,sfx,voice,_voice_samples},characters,episodes/authored/ep-01-arrival/{scripts,voice,cutscenes,videos,explore},locations,map,pc-select,shorts,transitions,ui,unlocks,onboarding,story-notif,whispers/voice}
cp "$PP/theme.css" "$W/theme.css"                       # başlangıç teması — High için yeniden renklendirilecek
cp "$PP/audio/manifest.json" "$W/audio/manifest.json"   # slot/hook kablolaması aynı; dosyalar yeniden üretilecek
cp "$PP/ui/look_rail.png" "$W/ui/look_rail.png"
cp "$PP/story-notif/"* "$W/story-notif/" 2>/dev/null || true
python3 - "$PP" "$W" "$slug" "$title" <<'PY'
import json, sys, re
PP, W, slug, title = sys.argv[1:]
def dump(p, o): json.dump(o, open(p, 'w'), indent=2, ensure_ascii=False)
# pcs.json: yapıyı koru, dünya adını değiştir, P&P galerilerini boşalt
pcs = json.load(open(f'{PP}/characters/pcs.json'))
pcs['world'] = slug; pcs['assetDir'] = f'worlds/{slug}/pc-select/'
for k in ('galleries', 'traitFace', 'names'):
    if isinstance(pcs.get(k), dict): pcs[k] = {g: ([] if isinstance(v, list) else {}) for g, v in pcs[k].items()}
pcs['_note'] = 'P&P yapısından kopyalandı; traitPool/epithet/drivers/manners/bioSeed metinleri Regency — High için yeniden yazılacak. galleries/traitFace/names boşaltıldı.'
dump(f'{W}/characters/pcs.json', pcs)
# ses manifesti: slotların dosya listelerini boşalt, kabloyu tut
m = json.load(open(f'{W}/audio/manifest.json'))
for s in m.get('slots', {}).values():
    if isinstance(s, dict):
        for key in ('files', 'variants'):
            if key in s: s[key] = []
        s['active'] = None if 'active' in s else s.get('active')
m['_note'] = f'{title}: slot ve hook isimleri motorla eşleşmeli (dialog2.html). Dosyalar audio/{{amb,music,sfx}}/ altına üretilecek; P&P örneği docs/engine/examples/.'
dump(f'{W}/audio/manifest.json', m)
dump(f'{W}/audio/voices.json', {
  '_note': 'ElevenLabs. characters.<folder>.{voices:{v4:{id,from}}, active:"v4", acting:{stability,register,allow,never}}. Örnek: docs/engine/examples/voices.json',
  'model': 'eleven_v4', 'settings': {'model': 'eleven_v4', 'stability': 0.5, 'similarity': 0.75, 'style': 0.0},
  'characters': {'narrator': {'acting': {'stability': 0.5, 'register': 'low, dry, close', 'allow': ['quiet', 'measured'], 'never': ['bright', 'expansive']}}}})
dump(f'{W}/map-locations.json', {'_note': 'x,y = map.jpg piksel; sx,sy = ekran; tier/order/unlockedBy/episode', 'locations': []})
dump(f'{W}/episode-locations.json', {'locations': [{'id': 'ep-01-arrival', 'title': 'Arrival', 'x': 0.5, 'y': 0.5, 'episode': 'episodes/authored/ep-01-arrival', 'order': 1, 'requires': None}]})
dump(f'{W}/map-roads.json', {'_note': 'map-tracer.html ile çizilir', 'roads': {'nodes': [], 'edges': []}, 'regions': [], 'updated': ''})
dump(f'{W}/map-fog.json', {'version': 1, 'w': 3072, 'h': 2048, 'fogs': [], 'updated': ''})
dump(f'{W}/whispers.json', {'_note': 'after=<episode pin id>, who=<character folder>, script=DSL', 'whispers': []})
dump(f'{W}/encounters.json', {'_note': 'mode=map|street, who=[folders], once, script=DSL', 'encounters': []})
dump(f'{W}/world-map.json', {'image': f'worlds/{slug}/world-map.jpg', 'w': 3072, 'h': 2048, 'seasons': [{'id': 's1', 'n': 1, 'title': f'{title} — Season 1', 'sub': '', 'x': 1536, 'y': 1024, 'region': {}, 'episodes': ['ep-01-arrival']}]})
open(f'{W}/episodes/SEASON-1.md', 'w').write(f'# {title} — Season 1\n\nControlling idea · protagonist desire vs misbelief · conflict web · per-episode table (location, value turn, discovery, cliffhanger, unlocks) · promise/payoff ledger · NPC continuity.\n\nP&P örneği: docs/engine/examples/SEASON-1.md\n')
open(f'{W}/episodes/authored/ep-01-arrival/scripts/main.txt', 'w').write(
'[bg:arrival_01] [amb:city] [music:arrival] [ui:narrative]\n'
'Narrative: The lift doors open on the fortieth floor and the city is already below you.\n\n'
'[ui:cast-small] [cast:concierge]\n'
'Concierge: You are expected. Though not, I think, by everyone.\n\n'
'(Choice:3)\n'
'You: Who exactly is expecting me?\n'
'Narrative: You say nothing and look past him, to the windows.\n'
'You: Then let us not keep them waiting.\n\n'
'(IfChoice:1)\nConcierge: That would be telling.\n\n'
'Narrative: The corridor is longer than it should be.\n')
open(f'{W}/README.md', 'w').write(f'# worlds/{slug}\n\nMotor bu klasörü `worlds/{slug}` olarak okur (dialog2.html / index.html / dev-server.js içinde sabit).\nEksik görseller: map.jpg (3072×2048), map_dawn/sunset/night, world-map.jpg, pc-select/*, characters/<f>/appearances/pride.png (sprite dosya adı motor sözleşmesi, "pride" kelimesi kalır), onboarding/*.\nÜretim boru hatları: docs/engine/SKILL.md\n')
PY

echo "▶ 3/5 motor yolları → worlds/$slug"
for f in dialog2.html index.html dev-server.js play.html review.html map-tracer.html; do
  [[ -f "$f" ]] || continue
  sed -i '' -e "s#worlds/pride-and-prejudice#worlds/$slug#g" \
            -e "s#'worlds', 'pride-and-prejudice'#'worlds', '$slug'#g" \
            -e "s#'worlds','pride-and-prejudice'#'worlds','$slug'#g" \
            -e "s#worlds\\\\/pride-and-prejudice#worlds\\\\/$slug#g" \
            -e "s#'pride-and-prejudice'#'$slug'#g" "$f"
done
sed -i '' -e "s#\"appId\": \"ai.roles.prototype\"#\"appId\": \"ai.roles.$slug\"#" -e "s#\"appName\": \"roles.ai UX\"#\"appName\": \"$title\"#" \
          -e "s#https://the-date-production.up.railway.app#https://REPLACE-ME-$slug.up.railway.app#" capacitor.config.json
sed -i '' -e "s#\"name\": \"the-date\"#\"name\": \"$slug\"#" -e "s#The Date — visual novel prototype#$title — visual novel#" package.json
sed -i '' -e "s#roles.ai — starting#$title — starting#" run.command

echo "▶ 4/5 eski içerik siliniyor"
rm -rf "$PP" worlds/london worlds/1984 _backup _mockups _shots _to_delete _docs mockups \
       proof-of-concept proof-of-concept-map-fx proof-of-concept-shortstreet characters voices store \
       combat-mock.html zoom-transitions.html dialog.html creator.html editor.html index2.html \
       HANDOVER.md creator-handoff.md __pycache__ tools/__pycache__
rm -f docs/proto-*.html docs/compare-*.html docs/jira-* docs/mock-*.html docs/dialog-ui-*.html docs/pin-moodboard*.html docs/ui-guideline*.html docs/product-review-*.html docs/cutscene-prompts-assembly.md
rm -rf ios/App/build ios/App/Pods ios/DerivedData
sed -i '' -e '/pride-and-prejudice/d' -e '/worlds\/london/d' .gitignore

echo "▶ 5/5 CLAUDE.md"
cat > CLAUDE.md <<EOF
# $title — roles.ai motoru üzerinde yeni dünya

Bu repo roles.ai (Pride & Prejudice) motorunun klonudur; P&P içeriği çıkarılmış, dünya \`worlds/$slug/\` altındadır.
Motor: \`dialog2.html\` (oyun, \`index.html\` editöründe \`#gameFrame\`), \`dev-server.js\` (üretim uç noktaları: ElevenLabs, gpt-image, Seedance yardımcıları).
Motor referansı + boru hatları: \`docs/engine/SKILL.md\` (aynı içerik account-wide \`roles-engine\` skill'i olarak da var).
Örnek içerik (DSL, sezon tablosu, sesler, fısıltılar): \`docs/engine/examples/\`.

## Çalışma kuralları
- Git'i Claude çalıştırmaz: \`zsh tools/ship.sh "mesaj" [--ios]\`.
- Sırlar (\`.env\`, API anahtarları) okunmaz; üretim çağrıları Chrome sekmesinden dev-server uç noktalarıyla tetiklenir (sandbox'ta ağ yok).
- \`dev-server.js\` değişince kullanıcı \`run.command\` ile yeniden başlatır.
- Mobil UI bozulmaz; masaüstü işi mobile dokunmaz.
- Motor içindeki \`pride\` pack id'si ve \`appearances/pride.png\` sprite adı motor sözleşmesidir — dünya adıyla ilgisi yok, değiştirilmez.

## $title dünyası
Ton: karanlık, yüksek bina / dikey şehir. Editoryal destek: bu proje için ayrı tone / world-book / season / episode skill'leri yazılacak (P&P'deki pp-season, roles-episode, pp-canon karşılıkları).

## Yapılacaklar (ilk kurulum)
- [ ] worlds/$slug/theme.css yeniden renklendir
- [ ] map.jpg (+dawn/sunset/night), world-map.jpg
- [ ] pc-select görselleri ve characters/pcs.json metinleri
- [ ] audio/manifest.json slotları için müzik/amb/sfx üret (docs/engine/SKILL.md → audio)
- [ ] characters/<folder>/appearances/pride.png + poses
- [ ] capacitor.config.json server.url → yeni Railway adresi; Xcode bundle id
EOF

echo
echo "✓ bitti → worlds/$slug hazır. Şimdi:"
echo "   git add -A && git commit -m \"$title: engine + empty world\" && git push -u origin main"
echo "   sonra Claude'da yeni proje aç, bu klasörü bağla, roles-engine skill'ini ekle."
