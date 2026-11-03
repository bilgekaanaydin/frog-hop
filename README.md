# FROG HOP

Doodle Jump tarzı, piksel sanatı bir zıplama oyunu. Tek dosya mantığında çalışır: `index.html` + `game.js` + `assets.js`.
Hiçbir harici kütüphane ya da sunucu tarafı yoktur; font ve sprite verileri `assets.js` içine gömülüdür.

## Çalıştırma

**Oyna:** https://bilgekaanaydin.github.io/frog-hop/ (GitHub Pages açıldıktan sonra). Kök dizindeki `index.html` oyunun tek dosyalık sürümüdür; kaynak kod `src/` içinde. İndirmek için `frog-hop.zip`.

Yerelde çalıştırmak için:

```bash
cd frog-jump
python3 -m http.server 80
```

Sonra telefondan `http://<bilgisayar-ip>/` adresine gir (Hop Up'ı denediğin gibi, ör. `http://192.168.1.127/`).
Safari'de "Ana Ekrana Ekle" dersen tam ekran açılır.

## Kontroller

- **Dokunmatik:** Parmağını basılı tutup sağa/sola kaydır, kurbağa parmağına doğru gider. Ekranın kenarından çıkınca diğer taraftan girer.
- **Klavye:** Sol/Sağ ok ya da A/D. Boşluk / Enter ile başlat ve yeniden oyna.
- **Eğim (Tilt):** Ayarlar panelinden açılır (iOS izin ister).

## Oyun içeriği

- **Platformlar:** Yeşil (normal), odun (hareketli), kuru/çatlak (bir kez zıpladıktan sonra kırılır), yaylı (ekstra yüksek zıplama).
- **Zorluk:** Yükseldikçe platform aralığı açılır, platformlar daralır, hareketli/kırılan platform ve sinek oranı artar. 450 m civarında tavana ulaşır; ara sıra aynı seviyede ikinci bir platform çıkarak yol kolaylaşır.
- **Güç barı (SUPER JUMP):** Platforma her konuşta, her coin'de ve yenen her sinekte dolar. Dolunca bir sonraki zıplama ekranın neredeyse tamamı kadar yükseğe çıkar.
- **Dil gücü (TONGUE):** Yolda çıkan pembe halkayı alınca 9 saniye boyunca menzile giren sinekleri dille yer. Her sinek +2 coin ve güç barına bonus.
- **Sinekler:** Dil gücü yokken çarpınca kurbağa sersemler ve aşağı itilir (yakalayacak platform yoksa düşer).
- **Coin:** Platform üstlerinde ve havada kavis şeklinde. Mağazada harcanır.
- **Gece/gündüz:** Her 320 m'de bir tam döngü. Güneş batar, yıldızlar çıkar, ay doğar; bulutlar da renk değiştirir.
- **Mağaza:** Şapka (7), gözlük (4), aksesuar (5). Satın alınan eşya üzerine tekrar dokununca çıkarılır.
- **Ayarlar:** Ses, titreşim, eğimle kontrol.
- **Kayıt:** Coin, rekor, sahip olunan eşyalar ve ayarlar `localStorage`'da tutulur.

## Dosyalar

- `index.html` - sayfa iskeleti
- `game.js` - oyunun tamamı (fizik, üretim, çizim, UI, ses)
- `assets.js` - kurbağa frame'leri (Frog1.eps'den piksel piksel çıkarıldı), bulut sprite'ları, PP NeueBit Bold font (base64)
- `assets/` - referans PNG'ler ve font dosyası

## Ayar yapmak istersen

`game.js` başındaki sabitler: `JUMP_V` (zıplama gücü), `SPRING_V`, `SUPER_V`, `MOVE_SPEED`, `TONGUE_TIME`, `DAY_CYCLE`.
Platform aralığı ve zorluk eğrisi `genUpTo` / `addPlatformBand` içinde (`lerp(34, 70, d)`), `diffAt` zorluğun kaç px'de tavana ulaşacağını belirler.
Mağaza eşyaları `ITEMS` nesnesinde; her eşya kurbağanın 38x28 gridine göre `ox/oy` ile konumlanan küçük piksel haritaları.
