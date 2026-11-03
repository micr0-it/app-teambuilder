# Kim Kimle? ⚽

Halı saha maçı öncesi "kim kimle oynayacak" tartışmasını bitiren bir takım kurma uygulaması. Bugün gelen 12 oyuncuyu seçiyorsun, uygulama mevkilere ve seviyelere göre dengeli iki takım kuruyor.



## Özellikler

- **Kadro yönetimi:** Oyuncu ekleme, düzenleme ve silme. Her oyuncunun mevkisi (KL, DF, OS, FV) ve 1–10 arası seviyesi var.
- **Kalıcı kayıt:** Kadro `localStorage`'da saklanıyor. İlk açılışta `players.json`'dan örnek kadro yükleniyor.
- **Bugün gelenler:** Checkbox'larla 12 oyuncu seçiliyor. Sayaç ve ipucu metni eksik ya da fazla seçimi anında gösteriyor.
- **İki algoritma, yan yana karşılaştırma:**
  - **Yılan usulü:** Oyuncular güçten zayıfa sıralanıp her seferinde toplamı düşük olan takıma veriliyor. Hızlı, ama her zaman en iyi sonucu bulmuyor.
  - **En dengeli:** Saha oyuncularının bölünebileceği bütün kombinasyonları (10 oyuncu için C(10,5) = 252) deneyip en iyi puanı alanı seçiyor.
- **Puanlama:** `mevki dışı oyuncu × 100 + puan farkı`. Bir oyuncuyu kendi mevkisi dışında oynatmak, birkaç puanlık dengesizlikten daha kötü sayılıyor.
- **Saha görünümü:** Takımlar sahada dizilişleriyle gösteriliyor. Mevki dışı oynayanlar sarı çerçeveyle ve `OS→DF` gibi bir notla işaretleniyor. Mobilde saha dikey dönüyor.
- **Kaleci seçimi:** Gelenler arasında tam 2 kaleci yoksa bir pencere açılıyor:
  - Eksikse: "Kaleye kim geçecek?" Saha oyuncularından seçiliyor.
  - Fazlaysa: "Hangi ikisi kalede?" Diğer kaleciler sahada oynuyor.

## Kullanılan teknolojiler

- HTML, CSS (Grid, Flexbox, `aspect-ratio`, `<dialog>`)
- Vanilla JavaScript (framework yok)
  - ES Modules (`import` / `export`, top-level `await`)
  - Class'lar, getter'lar, `static` alanlar
  - Recursive kombinasyon üretimi (backtracking)
  - Event delegation, `dataset`, `closest`
  - `fetch` ve `localStorage`

## Klasör yapısı

```
├── index.html
├── style.css
├── app.js              # arayüz ve olaylar
├── storage.js          # localStorage / players.json okuma-yazma
├── players.json        # örnek kadro
└── Models/
    ├── Player.js       # oyuncu: id, isim, mevki, seviye (doğrulamalı)
    ├── Team.js         # takım: kadro, toplam puan, mevki dışı sayısı
    └── TeamBuilder.js  # yılan usulü ve en dengeli algoritmaları
```

## Çalıştırma

Proje ES Modules ve `fetch` kullandığı için dosyayı çift tıklayarak (`file://`) açınca **çalışmaz**, bir yerel sunucu gerekir:

- **VS Code:** Live Server eklentisiyle `index.html`'e sağ tık → *Open with Live Server*
- **ya da terminalden:** `npx serve` veya `python -m http.server`

## Bu projede öğrendiklerim

- Kodu sorumluluklarına göre modüllere ayırmak: veri (`Models`), saklama (`storage.js`), arayüz (`app.js`)
- Bir problemi iki farklı algoritmayla çözüp sonuçlarını karşılaştırmak: hızlı ama yaklaşık vs. yavaş ama kesin
- `JSON.parse`'ın düz obje döndürdüğünü, class nesnesine geri çevirmek gerektiğini
- Olay yakalayan fonksiyonlarla (`e` alan) ekranı güncelleyen fonksiyonları ayırmak
- Tek bir veri kaynağı (`players` dizisi) tutup hem ekranı hem kaydı ondan güncellemek