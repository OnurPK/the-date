# iOS shell (Capacitor) — notes

- Capacitor **8.5.2** (`@capacitor/core`, `cli`, `ios`). Upgraded 2026-09-21 for Xcode 27 / iOS 27 SDK.
- The app is a remote WebView: `capacitor.config.json` → `server.url` = Railway `dialog2.html`. `www/` is an empty shell.
- **iOS 27 SDK requires the UIScene lifecycle.** Without it the app is killed at launch (black screen before splash, nothing in App Store Connect crashes). Fix lives in `ios/App/App/SceneDelegate.swift`, `AppDelegate.swift` (`configurationForConnecting`), `Info.plist` (`UIApplicationSceneManifest`), and the file entries in `project.pbxproj`. `npx cap sync ios` never touches these files; re-check them after any template migration.
- Build + upload: `zsh tools/ship.sh "msg" --ios` (log: `ios/App/build/ship.log`). `rm -rf ios/App/build` before `npx cap sync ios`, otherwise xcodebuild clean fails.
- Finder can leave `* 2.*` duplicate files (iCloud/"keep both"). In `node_modules/@capacitor/ios` they cause `invalid redeclaration` errors. Check: `find . -path ./node_modules -prune -o -name '* 2*' -print`.
- TestFlight external: App Store Connect → TestFlight → External Testing group → public link. First build of a version goes through Beta App Review; needs feedback email + privacy URL.
