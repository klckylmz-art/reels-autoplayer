# Instagram Reels AutoPlayer — WebView v2.0

Bu sürüm Play Protect uyarısına neden olan Accessibility Service'i tamamen kaldırır.

## Çalışma şekli
1. Uygulamayı aç.
2. Instagram uygulama içindeki güvenli WebView'de açılır.
3. Instagram'a doğrudan instagram.com üzerinde giriş yap.
4. İstediğin profilin Reels sekmesini aç.
5. `Reels Topla` butonuna bas.
6. Uygulama sayfayı kaydırıp görülebilen Reel linklerini sıraya alır.
7. Reels'leri Önceki / Play-Pause / Sonraki / Auto / Loop kontrolleriyle oynatır.

## Güvenlik
- Accessibility Service yok.
- Ekran okuma / başka uygulamaları kontrol etme izni yok.
- Instagram şifresini uygulama kodu toplamaz veya saklamaz.
- Giriş doğrudan instagram.com içinde gerçekleşir.
- Manifest yalnızca normal `INTERNET` izni ister.

## Auto Next
WebView içindeki aktif video periyodik olarak kontrol edilir. Video bittiğinde veya sonuna geldiğinde sıradaki Reel açılır.

## Build
GitHub Actions `Build Signed Release APK` workflow'u zipalign + apksigner ile signed release APK üretir.
