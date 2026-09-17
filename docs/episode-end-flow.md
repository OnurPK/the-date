# Episode end flow — Dashboard · Consequence · Map Events

Prototip: `docs/proto-episode-end.html`. Kod: `dialog2.html` → `prideEndFlow` IIFE (+ `#pride-endflow-css`), whisper UI (`prideWhisperUI`) üstüne kurulu.

## Sıra

1. **Episode biter → Dashboard (hemen)** — 3 sayfa, tap ile: Traits → Relationships → Global. Arka plan = episode'un son sahnesi (cutscene/backdrop), yoksa episode cover.
2. **Harita** → aynı turda açılan hedefler için **Map Event** (yatay ok / "Unlock olanlar"): kamera kayar → pin belirir → polaroid kart → Continue.
3. **⌂ (zaman geçer) → interlude** → **Consequence** (önceki turda kaçırılan episode'ların sahibi konuşur) → turu gelen hedefler için **Map Event** → harita → whisper.

## Veri

- `map-locations.json` episode kaydı:
  - `missed: { who, bg, script }` — kaçırılırsa oynayan sahne. `bg` `worlds/pride-and-prejudice/` altına göre yol; boşsa `episodes/<ep>/cover.jpg`. Script = whisper DSL (`Konuşan: …`, `Mechanics: (Relation: id | trust | -1)`); `[cast:]` yoksa büst sağda.
  - `cover` — Map Event polaroid görseli (opsiyonel; yoksa episode cover, o da yoksa `map_zoom01.jpeg`).
  - `desc` — polaroid metni (yoksa "X is inviting you." / "A new place is open to you.").
- Editör: Story map → episode düğümü → **Kaçırılırsa · Consequence** (konuşan, arka plan, script; otomatik kayıt `location-upsert`).
- Kalıcı durum: `rai.mapEvents` (bekleyen reveal kuyruğu — pin gizli + sis tutulur), `rai.conseqDone`. New game ikisini de sıfırlar.
- Dashboard verisi: `prideEpiBase` (episode başında scandal/allure/suitor stat/trait snapshot) vs `prideMeta`.
  - Trait: choice `[trait: X]` tag'leri `TRAIT_ALIAS` ile PC trait anahtarına eşlenir; vuran varsa Progress +1, ≥2 seçimde hiç vurmadıysa Stress +1 (`meta.traits[key] = {progress, stress}` 0–3).
  - Relation: `(Relation: id | desire|trust|affection|romance | ±n)` artık stat'ı değiştirir (`n × PRIDE_REL_STEP=10`). Aşama isimleri suitor detail ile aynı.

## API (window)

`prideEpiDashboard(title, cb)` · `prideQueueMapEvents(ids, src)` · `prideMapEventPending(id)` · `prideRunMapEvents(cb)` · `prideAfterEpisode(src)` · `prideRunConsequences(prevOrd, cb)` · `prideTurnSequence(prevOrd)` · `pridePlayWhisper(enc, {bg, eyebrow, noX, onDone})` · `pridePlayMapCard(card, cb)` · `prideRelationApply(id, dim, delta)` · `prideTraitBump(key, 'progress'|'stress')`.
