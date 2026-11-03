# FROHG

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

## Geliştirme

Kaynak kod `src/` içinde. Değişiklikten sonra `python3 build.py` çalıştır: `src/` dosyalarını tek bir `index.html` içine gömer ve `frog-hop.zip`'i yeniler.
Yazılar PP NeueBit Bold ile çizilir. `tools/make_font.py` fontu kendi piksel ızgarasında (1 piksel = 1/28 em) bitmap'e çevirip `src/assets.js` içine yazar. Yazılar ekranın tam çözünürlüğünde tam sayı ölçekle çizildiği için her cihazda keskin kalır.

## Görsel kimlik

Arayüz yalnızca iki renk kullanır: lime `#d0f053` ve siyah `#000000`. Başlıktaki logo `assets/logo.svg` dosyasından vektör olarak çizilir, bu yüzden her ekranda keskin kalır.

## Oyun içeriği

- **Platformlar:** Yeşil hap (normal, kırılmaz), sarı hap (hareketli), cam (bir kez zıpladıktan sonra kırılıp parçalanır), bataklık (yapışkan, zayıf zıplatır), yaylı (ekstra yüksek zıplama).
- **Zorluk:** Yükseldikçe platform aralığı açılır, platformlar daralır, hareketli/cam/bataklık platform ve sinek oranı artar. 450 m civarında tavana ulaşır; ara sıra aynı seviyede ikinci bir platform çıkarak yol kolaylaşır.
- **EXP ve seviye:** Her zıplayış, her coin ve yenen her sinek EXP verir. Bar dolunca LEVEL UP: her seviye zıplamayı %4 artırır (en fazla %24) ve bir sonraki zıplama SUPER JUMP olur.
- **Ekstra can (+1UP):** Her 3. seviyede bir can kazanılır (en fazla 2). Düşünce kurbağa görünür bir platforma geri döner ve kısa süre dokunulmaz olur.
- **Dil gücü (TONGUE):** Yolda çıkan pembe iksir şişesini alınca 10 saniye boyunca kurbağanın etrafında pembe bir hale belirir ve menzile giren sinekler dille yakalanıp yenir. Her sinek +2 coin ve EXP.
- **Sinekler:** Dil gücü yokken çarpınca kurbağa sersemler ve aşağı itilir (yakalayacak platform yoksa düşer).
- **Coin:** Platform üstlerinde ve havada kavis şeklinde. Mağazada harcanır.
- **Gece/gündüz:** Her 320 m'de bir tam döngü. Güneş sağ üstte batıp sönerken ay aynı yerde doğar; bulutlar da renk değiştirir.
- **Uzay:** 1800 skordan sonra gökyüzü kararır, 2000'de tamamen uzaydasın: renkli parıldayan yıldızlar, kayan pixel gezegenler (halkalı, gaz devi, dünya benzeri, Mars, Neptün...) ve kuyruklu yıldızlar.
- **Mağaza:** Şapka (7), gözlük (4), aksesuar (5). Satın alınan eşya üzerine tekrar dokununca çıkarılır. Test sürümünde `FREE_SHOP = true` olduğu için her şey bedava; yayına alırken `src/game.js` içinde `false` yap.
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
