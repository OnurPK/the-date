#!/bin/zsh
# Tek komutla yayınla.
#   zsh tools/ship.sh "mesaj"          → git add/commit/push (Railway deploy → uygulama + web güncellenir)
#   zsh tools/ship.sh "mesaj" --ios    → üstüne iOS Archive + TestFlight upload (native değişikliklerde)
#   zsh tools/ship.sh --ios            → sadece iOS
#
# iOS tarafı Xcode'a giriş yapılmış hesabı kullanır (otomatik imza). Build numarası App Store Connect
# tarafından otomatik artırılır (manageAppVersionAndBuildNumber), elle Build değiştirmek gerekmez.
set -e
cd "$(dirname "$0")/.."

msg=""; ios=0
for a in "$@"; do
  if [[ "$a" == "--ios" ]]; then ios=1; else msg="$a"; fi
done

if [[ -n "$msg" ]]; then
  echo "▶ git"
  git add -A
  git commit -m "$msg" || echo "  (commit edilecek değişiklik yok)"
  git push
fi

if [[ $ios -eq 1 ]]; then
  cd ios/App
  rm -rf build; mkdir -p build
  LOG="build/ship.log"
  echo "▶ iOS archive (log: ios/App/$LOG)"
  if ! xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
      -destination 'generic/platform=iOS' -archivePath build/App.xcarchive \
      -allowProvisioningUpdates archive >"$LOG" 2>&1; then
    echo "✗ archive başarısız — hatalar:"; grep -E "error:|Error:|FAILED" "$LOG" | grep -v "exit code 0" | head -20; exit 1
  fi
  echo "▶ TestFlight upload"
  if ! xcodebuild -exportArchive -archivePath build/App.xcarchive \
      -exportOptionsPlist ../../tools/ExportOptions.plist -exportPath build/export \
      -allowProvisioningUpdates >>"$LOG" 2>&1; then
    echo "✗ upload başarısız — hatalar:"; grep -iE "error|fail" "$LOG" | tail -20; exit 1
  fi
  echo "✓ yüklendi — App Store Connect 5–15 dk işler, sonra TestFlight'a otomatik düşer"
fi
