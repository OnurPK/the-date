# roles.ai — Oturum Devri (Handover)

Bu doküman, `roles.ai` görsel-roman prototipinde kaldığımız yeri yeni bir oturuma
aktarmak için yazıldı. Yeni oturum bu dosyayı okuyup **doğrudan devam edebilir**.

---

## 0. En acil iş (ilk bunu yap)

`dialog2.html` içindeki **story runner**'a (karakter yaratma bölümü), son sorudan sonra
6 saniyelik bir **"Becoming someone…" loading ekranı** eklenecek. Kod hazır, sadece 3
düzenleme (aşağıda "EK: Loading animasyonu kodu" bölümünde birebir verildi).

Davranış: "Becoming someone…" başlığı **sabit**; altındaki italik alt yazı **2 saniyede
bir** değişir (3 cümle); altın renkli 3 spinner noktası; **6 saniye** sonra karakter
ekranı (`openDetailNew`) açılır.

> Not: Bu animasyon başka bir dosyadan aktarılmıyor, oyun-içi sahne veya astroloji
> yükleyici de değil. **Sıfırdan, bir referans mockup'tan tasarlanmış yeni bir ekran.**
> Kaynağını aramaya gerek yok; aşağıdaki kodu uygula.

---

## 1. Proje ve dosya konumları

- **Ana dosya:** `roles-ai/dialog2.html` — tek dosyalık VN motoru (~30.000+ satır).
  HTML-yorumuyla ayrılmış "enjekte modüller" (`<style>` + HTML + `<script>` IIFE) içerir.
- **Senaryo dokümanı:** `scenario.md` — 7 bölümlük hikâye, sahne promptları, diyaloglar,
  4 seçenek + trait ağırlıkları.
- **Karakter promptları:** `character-prompts.md` — julian_vane, mr_ashford (+fallen),
  miss_vere (+ruined), mr_coyle, the_father.
- **Sahne görselleri:** `worlds/pride-and-prejudice/pc-select/story-scenes/`
  - Her bölüm için `cc_<bg>_a.webp` (sinematik, karakterli anlatı sahnesi) ve
    `cc_<bg>_b.webp` (atmosferik, boş — diyalog/seçim arka planı).
  - bg adları: `will, vow, terrace, venture, sentence, mercy, reckon`.
- **Karakter kesitleri (bust):** `worlds/pride-and-prejudice/characters/<id>/appearances/pride.png`
  — şeffaf, 1500px yükseklik. (julian_vane, mr_ashford, mr_ashford_worn, mr_coyle,
  miss_vere, miss_vere_ruined, the_father)
- **Sahne üretimi:** `gen_scenes.py` (cihazda) — OpenAI gpt-image ile sahne üretir.

---

## 2. Şu ana kadar tamamlananlar

**"Through a Story" karakter-yaratma bölümü** baştan sona kuruldu ve test edildi:

- Haritada "Create Your Character" ekranı → 2 cam kart ("Through a Story" / "Trust the Stars").
- "Through a Story" seçilince 7 bölümlük hikâye oynanır (narrative → small-dialogue →
  multi-choice döngüsü), sonunda cevaplara göre bir karakter yaratılır.
- Cevaplar "as her" oynanırsa 9 trait içinde **wit** öne çıkar → epithet **"The Wit"** →
  karakter **Cecily Vane** olarak açığa çıkar (bu isim bağlaması **cihazdaki dosyada
  zaten uygulandı**, `buildCharFromScores` içinde: `tr[0]==='wit' && gv==='woman'` →
  `'Cecily Vane'`).
- 7 sahnenin sinematik `_a` görselleri yerinde; will/terrace/venture'da eskiden oluşan
  "çift karakter" hatası düzeltildi (tek karakterli temiz sürümler kullanılıyor).

**Cihazdaki `dialog2.html` durumu:** Cecily Vane düzeltmesi VAR; **loading animasyonu
YOK** (o commit köprü koptuğunda başarısız oldu). Yani yeni oturumun tek yapması gereken
Bölüm 0'daki loading animasyonunu eklemek.

---

## 3. Story runner mimarisi (düzenleme yaparken gerekli)

Modül bir IIFE; `dialog2.html` içinde `#pcStory` ve `pcStoryStart` etrafında.

- **`STORY_BEATS`** (dizi, 7 eleman): her bölüm
  `{ bg, who, narr:[...], say:[...], q, a:[{t, w:{trait:n}}] }`.
  - `narr`/`say` dizi → tıklayarak ilerleyen 2–3 ekrana bölünür.
  - `who` = konuşan karakter id'si (veya null).
- **`window.pcStoryStart()`** — bölümü başlatır. (`document.body.setAttribute('data-pack','pride')`
  gerekli.)
- **`psInject()`** — `#pcStory` DOM'unu kurar: `.ps-scene`, `.ps-top`, `.ps-narr`,
  `.ps-dlg` (içinde `.ps-fig` bust), `.ps-choices`. (Loading eklenince `.ps-load` da burada.)
- **`renderBeat()` / `psShowStage()`** — sahneyi çizer.
  - `storyBg(id)` → `BASE + 'pc-select/story-scenes/' + id + '.webp'`.
  - narrative → `cc_<bg>_a` (sinematik). say/choices → `cc_<bg>_b` (atmosferik) + bust.
- **`psAdvance()`** — narr/say ekranlarını tıklayarak ilerletir.
- **`psPick(ai)`** — seçilen cevabın trait ağırlıklarını toplar, sonraki bölüme geçer;
  son bölümde **`psFinish()`** çağrılır.
- **`psFinish()`** — (loading eklenecek yer) → `openDetailNew(c)` ile karakter ekranı.
- **`buildCharFromScores(scores, answers)`** — trait'lerden karakteri kurar; wit→Cecily.

Trait sırası: `["pride","wit","candor","warmth","cunning","reserve","ambition","charm","devotion"]`.
Epithet en yüksek trait'ten gelir (wit → "The Wit").

---

## 4. KRİTİK KURAL — UI uydurma

**Her zaman gerçek P&P UI'sini yeniden kullan; asla yeni/uydurma UI üretme.**
- Narrative = `.fe-narr` (alt scrim, Lora serif).
- Diyalog = `.fe-dlg` (açık cam).
- Seçimler = `.fe-choicewrap` / `.choice-opt` (açık cam kartlar).
- Karakter bust = `[ui:inner-small]` / `#endDialog` deseni (`.focus-character` /
  `.es-character` — diyalog kutusunun İÇİNDE, ismin/metnin solunda, alttan mask ile eritilir).

Story runner'ın `ps-*` sınıfları bu desenlere göre modellendi; yeni bir şey eklerken de
bu kurala uy — kod tabanındaki mevcut UI'nin dışına çıkma.

---

## 5. Nasıl test edilir

- Yerel sunucu: proje klasöründe **`node dev-server.js`** → `http://localhost:8000/dialog2.html`.
- Story'e hızlı atlamak için tarayıcı konsolunda:
  `document.body.setAttribute('data-pack','pride'); window.pcStoryStart();`
- 7 bölümü "as her" (wit) oynayınca sonuç **Cecily Vane — The Wit** olmalı, hatasız.
- Loading eklendikten sonra: son seçimden sonra 6 sn "Becoming someone…" ekranı gelmeli,
  alt yazı 2 sn'de bir değişmeli, sonra karakter ekranı açılmalı.

---

## 6. Notlar

- GitHub push'u kullanıcı kendi terminalinden yapıyor (bu ortamda ağ yok).
- Sahne üretimi cihazda `gen_scenes.py` ile, kullanıcının OpenAI API anahtarıyla yapılıyor
  (`cc_*` sahneleri `STORY_STYLE` kullanır; `_a` karakterli, `_b` boş atmosferik).

---

## EK: Loading animasyonu kodu (Bölüm 0 için — birebir uygula)

### 1) CSS — şu satırı bul:
```
      '#pcStory .ps-opt:active{ transform:scale(.99); }'
    ].join('\n'); document.head.appendChild(st);
```
Şununla değiştir:
```
      '#pcStory .ps-opt:active{ transform:scale(.99); }',
      '#pcStory .ps-load{ position:absolute; inset:0; z-index:9; display:none; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 28px; background:radial-gradient(125% 95% at 50% 32%, #1b1428 0%, #0d0912 68%); }',
      '#pcStory.show-load .ps-load{ display:flex; }',
      '#pcStory .ps-load .pl-eyebrow{ font-weight:800; font-size:13px; letter-spacing:.26em; text-transform:uppercase; color:#8a7c93; margin-bottom:34px; }',
      '#pcStory .ps-load .pl-spark{ display:block; margin-bottom:26px; transform-origin:center; animation:plSpark 3s ease-in-out infinite; }',
      '@keyframes plSpark{ 0%,100%{ transform:rotate(0) scale(1); opacity:.78 } 50%{ transform:rotate(45deg) scale(1.14); opacity:1 } }',
      '#pcStory .ps-load .pl-title{ font-family:"Playfair Display",Georgia,serif; font-weight:700; font-size:clamp(32px,9vw,46px); line-height:1.05; color:#f4eee1; margin:0 0 18px; }',
      '#pcStory .ps-load .pl-sub{ font-family:"Lora",Georgia,serif; font-style:italic; font-size:clamp(16px,4.6vw,20px); color:#bcb0c6; min-height:28px; opacity:1; transition:opacity .35s ease; margin-bottom:46px; }',
      '#pcStory .ps-load .pl-dots{ display:flex; gap:14px; }',
      '#pcStory .ps-load .pl-dots i{ width:12px; height:12px; border-radius:50%; background:#c8a86a; opacity:.32; animation:plDot 1.4s ease-in-out infinite; }',
      '#pcStory .ps-load .pl-dots i:nth-child(2){ animation-delay:.22s; }',
      '#pcStory .ps-load .pl-dots i:nth-child(3){ animation-delay:.44s; }',
      '@keyframes plDot{ 0%,100%{ opacity:.3; transform:translateY(0) } 50%{ opacity:1; transform:translateY(-3px) } }'
    ].join('\n'); document.head.appendChild(st);
```

### 2) HTML — şu satırı bul:
```
      +'<div class="ps-choices"><div class="ps-q"></div><div class="ps-list"></div></div>';
    document.body.appendChild(el);
```
Şununla değiştir:
```
      +'<div class="ps-choices"><div class="ps-q"></div><div class="ps-list"></div></div>'
      +'<div class="ps-load"><div class="pl-eyebrow">Pride and Prejudice</div>'
        +'<svg class="pl-spark" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C12.6 6.4 17.6 11.4 24 12 C17.6 12.6 12.6 17.6 12 24 C11.4 17.6 6.4 12.6 0 12 C6.4 11.4 11.4 6.4 12 0 Z" fill="#c8a86a"/></svg>'
        +'<div class="pl-title">Becoming someone…</div><div class="pl-sub"></div>'
        +'<div class="pl-dots"><i></i><i></i><i></i></div></div>';
    document.body.appendChild(el);
```

### 3) `psFinish` fonksiyonu — şunu bul:
```
  function psFinish(){
    const c=buildCharFromScores(ps.scores, ps.answers);
    const e=psEl(); if(e) e.classList.remove('on','fig-on','show-narr','show-say','show-choices'); ps=null;
    document.body.classList.remove('pc-story-on');
    $('pcsel').classList.add('on'); openDetailNew(c);
  }
```
Şununla değiştir:
```
  const PS_LOAD_LINES=[
    'Giving you a wound worth having…',
    'Sharpening the wit that will outlast the room…',
    'Lighting the candle you will be remembered by…'
  ];
  function psFinish(){
    const c=buildCharFromScores(ps.scores, ps.answers);
    const e=psEl();
    psPanel('load');
    const sub=e.querySelector('.ps-load .pl-sub');
    let li=0; if(sub){ sub.textContent=PS_LOAD_LINES[0]; sub.style.opacity='1'; }
    const rot=setInterval(()=>{
      li++; if(li>=PS_LOAD_LINES.length){ return; }
      if(!sub) return; sub.style.opacity='0';
      setTimeout(()=>{ sub.textContent=PS_LOAD_LINES[li]; sub.style.opacity='1'; }, 330);
    }, 2000);
    setTimeout(()=>{
      clearInterval(rot);
      if(e) e.classList.remove('on','show-load','fig-on','show-narr','show-say','show-choices');
      ps=null; document.body.classList.remove('pc-story-on');
      $('pcsel').classList.add('on'); openDetailNew(c);
    }, 6000);
  }
```

Uygulandıktan sonra Bölüm 5'teki testi çalıştır.
