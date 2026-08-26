# Instagram Reels AutoPlayer — Native Instagram Overlay

Bu sürüm WebView kullanmaz. Instagram'ın kendi Android uygulamasının üstünde çalışır.

## Kullanım
1. APK'yı kur.
2. Uygulamayı aç.
3. `1. ACCESSIBILITY İZNİNİ AÇ` butonuna bas.
4. Android Accessibility ekranında `Reels AutoPlayer` hizmetini etkinleştir.
5. Uygulamaya dönüp `2. INSTAGRAM'I AÇ` butonuna bas.
6. Instagram'da Reels ekranına git.
7. Üstte küçük kontrol paneli görünür.

## Kontroller
- ◀ : Önceki Reel (aşağı kaydırma)
- Play/Pause : ekran merkezine dokunur
- ▶ : Sonraki Reel (yukarı kaydırma)
- AUTO : zamanlı otomatik sonraki Reel
- −5 sn / +5 sn : otomatik geçiş süresi
- Panel sürüklenebilir

## Önemli
Instagram'ın native Android uygulaması başka bir uygulamaya videonun gerçek `ended` olayını vermez.
Bu nedenle Auto modu süre tabanlıdır.

Uygulama Instagram kullanıcı adı/şifresini istemez ve saklamaz.

## APK Build
GitHub Actions içindeki `Build Android APK` workflow'u `app-debug.apk` üretir.
