# roles.ai — Episode Sistemi Yol Haritası

**Kuzey yıldızı:** Bir brief'ten **tek tıkla oynanabilir episode** üretmek — script + seçim/sonuç kodları + tüm asset'ler (backdrop, cutscene, intro/ending, portre, item/anı görselleri) + map'e yerleşim, hepsi otomatik.

**Temel ilke:** Her özellik üç yüzeyde birden çalışır ve **asset yönetimiyle** entegredir:
1. **Senaryo editörü** (yazma/düzenleme arayüzü)
2. **Senaryo / DSL** (satır düzeyi kodlar)
3. **Map + oyun UI** (gösterim + ilerleme)
4. **Asset yönetimi** (her kod, gerektiğinde üretilebilir bir asset doğurabilir — cutscene pipeline'ının aynısı)

---

## Mevcut yapı taşları (sıfırdan değiliz)
- DSL mekanikleri: `(Relation:)`, `(Discover:)`, `(Discovery: text)`, `(Scandal:±N)`, `(Allure:±N)`, `(Trait:)`, `(Quest:)` + in-game toast'lar.
- Suitor DB: `xp`, `levelOf(xp)`, discovery ring'leri (`known/total`), `desire/trust/affection`, "facts".
- Global meter: scandal / allure (`prideMetaAdd`) + barlar.
- Seçim: `(Choice:N)` / `(IfChoice)` / `[trait:]`.
- Episode unlock (appearsAfter / unlockedBy), "Continue → map" bitişi, Suitors ekranı entegrasyonu (`(Discover: id)` → kilit açılır).
- Asset pipeline: Assets sekmesi (scan → generate), karakter referansı, intro/ending, cutscene→bubble.

---

## Fazlar (sıra: 0 → 1 → 2 → 3 → 4)

- **Faz 0 — Seçim-sonuç "kod" sistemi. ✅ TAMAMLANDI.** DSL (XP/Item eklendi), motor apply+toast, suitor XP/level bağı, editör **Codes** sekmesi (çip/dropdown → script), item/discovery görselleri Assets'te üretilebilir. Uçtan uca test edildi.
- **Faz 1 — Suitor discovery içeriği + level/XP. ✅ TAMAMLANDI.** `(Discovery: suitor | fact)` yapısal → keşif metni suitor'a kaydolur (`prideDiscoverFact`), her yeni keşif +8 XP; XP→level (`levelOf`), level atlayınca mini-toast. Suitors kart + detay: discovery ring `x/total` keşif metinlerini kapsar, keşifler kart olarak listelenir. Item ayrı UI'a ertelendi. **Editör:** her suitor'ın keşif havuzu artık `characters/<id>/character.json` içinde (`discoveries[]`); `GET /api/author/suitors` endpoint'i verir; Codes sekmesinde `(Discovery:)` = suitor dropdown + keşif dropdown (havuzdan seç veya özel). Uçtan uca test edildi (country-lane ana hat: 25 XP, 1 keşif). NOT: endpoint için dev-server yeniden başlatılmalı.
- **Faz 2 — Aksiyonların UI'da görünmesi. ✅ TAMAMLANDI.** Tutarlı mekanik toast'lar: her kod kendi ikon+rengiyle (xp/item/scandal/allure kendi sınıfları); scandal/allure artık toast gösteriyor (önce sessizdi). Toast kuyruğu: aynı tick'te gelen mekanikler max 3 ekranda, fazlası slot açılınca sıraya girer (anında evict yok). Editör Codes: chip'ler koda göre renk+ikon kodlu. Test: DOM + editör görsel doğrulandı. (Toast'lar worlds/map/end ekranlarında gizli, sadece oyun içinde.)
- **Faz 3 — Bölüm sonu meter dashboard'u. ✅ TAMAMLANDI.** Episode boyunca olaylar loglanıyor (`prideEpiReset` loadScript'te baseline; `prideEpiRecord` showMechToast + endChoice'tan). Bitiş "Continue" → **chapter-end dashboard**: Scandal/Allure değer + delta barları, "Your decisions" (trait chip'leri), "Discovered" (keşif chip'leri), "Bonds deepened" (suitor +XP · Lv · Trust), sonra Continue → map. Test: özet aggregation + görsel doğrulandı (country-lane ana hat).
- **Faz 4 — Dallanan episode davetleri (harita çatalı). ✅ TAMAMLANDI (consequence içeriği hariç).** Harita üstünde birbirini dışlayan görevler. DSL: `(Unlock: id | group=G | kind=main|side | timer=N | title/desc/cover)` biten episode'un script'inde. Aynı `group` = pair (dışlayan). **CASE 1 (ana çatal):** pembe pulse + "Continue" rozeti; grupsuz unlock'lar bağımsız açılır. **CASE 2 (side-pair):** amber pin + geri sayım rozeti; timer sadece harita açıkken işler (oturum içi); süre dolunca ikisi de declined. Her pin `openPOI`'de yakalanır → **karar seçim ekranı** (2 kart: cover+açıklama+aksiyon, "You can only choose one") → seç → grup declined + `display:none`. State `prideMeta`'da (forceOpen/pairs/declinedEps). Consequence hook (`pridePathConsequence`) hazır ama boş — içerik sonra. **Editör authoring:** result view'da "Fork" sekmesi — hedef episode dropdown (/api/author/episodes) + kind(main/side) + grup + timer + title/desc/cover; script'e `(Unlock:)` satırları yazar. DOM testi: scan/apply/pairOf/pick/openPOI/refresh/countdown/expiry + editör Fork sekmesi doğrulandı. Ayrıca ▶ play artık v2'yi pack:pride+episode ile açıyor (uçtan uca oynanabilir).

---

## FAZ 0 — Seçim-sonuç "kod" sistemi ✅ TAMAMLANDI

**Amaç:** Her seçim opsiyonuna, editörden eklenebilen ve motorun uyguladığı **sonuç kodları** bağlamak. Tüm ilerleme sisteminin (discovery, XP, level, scandal, item, relation) tek geçiş noktası. Bu standartlaşınca one-click üretim mümkün olur.

### Kod seti (DSL — satır düzeyi)
Mevcutlar korunur; eksikler eklenir:
- `(Relation: suitor | trust|romance|desire | ±N)` — ilişki puanı *(var)*
- `(Discover: suitor)` — suitor'ı Suitors ekranında açar *(var)*
- `(Discovery: suitor | factId)` — belirli bir keşif (anı/item/görünüş) açar **(yeni yapı — Faz 1 ile derinleşir)**
- `(XP: suitor | +N)` — suitor XPّi / level **(yeni)**
- `(Scandal: ±N)` / `(Allure: ±N)` — global meter *(var)*
- `(Item: itemId)` — envantere/koleksiyona item **(yeni)**
- `(Trait: Name)` — PC trait *(var)*

Seçim opsiyonları bu kodları `(IfChoice:N)` bloğu içinde `Mechanics: (...)` olarak taşır *(mevcut yapı)*.

### Senaryo editörü
- Choice opsiyonu düzenleme paneli: her opsiyonun altında **"Bu seçim ne yapar?"** — çip/dropdown ile kod ekleme (discovery / xp / scandal / allure / relation / item / trait).
- Kaydedince script'e `Mechanics:` satırları olarak yazılır (mevcut Mechanics parse'ı okur).
- Kodlar script görünümünde + choice kutusunda özet rozet olarak görünür.

### Motor (apply)
- Mekanik uygulama zaten var; eksik kodlar eklenir: `XP:` → suitor xp += N (+ level hesap), `Item:` → envanter.
- Her kod bir toast + ilgili ekran güncellemesi tetikler.

### Asset yönetimi bağlantısı
- `Item:` ve `Discovery:` (anı/görünüş) kodları **üretilebilir asset** doğurur: item ikonu, anı görseli. Bunlar Assets sekmesinde cutscene pipeline'ının aynısıyla (scan → generate, referanslı) çıkar.
- Yani kod = sadece sayı değil; gerektiğinde görsel de.

### Kabul kriterleri (Faz 0 "done")
1. Editörden bir seçime kod eklenebiliyor → script'e `Mechanics:` olarak yazılıyor.
2. Oyunda o seçim seçilince kod uygulanıyor + toast görünüyor.
3. Kodun etkisi ilgili ekrana yansıyor (Suitors XP/level, scandal barı, envanter).
4. Görsel gerektiren kodlar (item/anı) Assets sekmesinde üretilebiliyor.

### İş kalemleri (önerilen sıra)
1. DSL + motor: `XP:` ve `Item:` mekaniklerini ekle + apply + toast.
2. Suitor XP/level'i `(XP:)` ile bağla (Faz 1'e köprü).
3. Editör: choice opsiyonuna kod ekleme UI'ı (çip/dropdown) + script'e yazma.
4. Asset: item/anı görsellerini scanAssets'e dahil et.
5. Test: editörden kod ekle → oyunda uygula → UI + asset doğrula.

---

## Story-map editörü (Faz 4 authoring — görsel)
Editörde **Story** sekmesi: tüm episode'lar düğüm (harita x/y), kenarlar = unlock/fork (gri düz statik, pembe kesik ana çatal, amber kesik süreli). **Faz A** okunur görünüm + tıkla-inspector. **Faz B** sürükle-bağla: düğümden düğüme sürükle → unlock ekle; inspector'da satır düzenle (tür main/side · grup=pair · timer · sil); aynı grup = pair. Server: `GET /api/author/story-map` (tarar), `POST /api/author/save-unlocks` (episode main.txt'e (Unlock:) yazar). Fork'un eski form-tabanlı editörü (result view "Fork" sekmesi) hâlâ duruyor; story-map onun görsel üstü. NOT: iki endpoint için dev-server restart.

## Notlar
- Her faz sonunda oynanabilir bir dilim çıkar; fazlar birbirinin üstüne biner.
- Faz 4 (davetler) en karmaşık ve hepsine bağlı → en sonda.
- Nihai hedef: brief → tek tık → script + kodlar + asset'ler + intro/ending + map yerleşimi.
