# Hayal Kahvesi Puantaj — Personel / Sanatçı / Güvenlik Tasarımı

## Amaç
Mevcut Puantaj uygulamasını üç alt gruba ayırmak: Personel, Sanatçı ve Güvenlik. Personel mevcut saatlik/mesaili sistemini korur. Sanatçı ve Güvenlik günlük geliş başına manuel ücret ile çalışır.

## Program Adı
Arayüz başlığı ve pencere adı: **Hayal Kahvesi Puantaj**. Dağıtım klasöründe dosya adı önceki isteğe uygun olarak `Puantaj.exe`, veri dosyası `data.json` kalır.

## Gruplar
### Personel
- Mevcut saat giriş tablosu aynen korunur.
- Saat ücreti, mesai katsayıları, Brüt Maaş, Avans, Net Ödeme, Maaş ve Prim hesapları korunur.
- Prim = Net Ödeme - Maaş.

### Sanatçı
- Saat hesabı yoktur.
- Geldiği her gün için manuel **Sahne Ücreti** girilir.
- Her günün ücreti ayrı olabilir.
- Aylık toplam sahne ücreti otomatik toplanır.
- Aylık Maaş manuel girilir.
- Avans mevcut tarihli avans sistemiyle kaydedilir.
- Net Ödeme = Toplam Sahne Ücreti - Maaş - Avans.

### Güvenlik
- Saat hesabı yoktur.
- Geldiği her gün için manuel **Günlük Ücret** girilir.
- Her günün ücreti ayrı olabilir.
- Aylık toplam günlük ücret otomatik toplanır.
- Aylık Maaş manuel girilir.
- Avans mevcut tarihli avans sistemiyle kaydedilir.
- Net Ödeme = Toplam Günlük Ücret - Maaş - Avans.

## Veri Modeli
- Mevcut çalışanlarda grup alanı yoksa varsayılan `personel` kabul edilir.
- Çalışan nesnesine `group: personel|sanatci|guvenlik` eklenir.
- Sanatçı/Güvenlik günlük ücretleri aylık detaylarda `dailyFees[employeeId][day]` altında saklanır.
- Sanatçı/Güvenlik Maaş değerleri mevcut şifreli Muhasebe kasasında grup bağımsız aylık `salaries` yapısında saklanır.
- Tüm değişiklikler anında `data.json` dosyasına yazılır.

## Arayüz
- Aylık Puantaj, Aylık Özet ve Muhasebe ekranlarında grup seçici bulunur: Personel / Sanatçı / Güvenlik.
- Personel seçildiğinde mevcut tablo aynen görünür.
- Sanatçı seçildiğinde gün hücreleri Sahne Ücreti alanları olur.
- Güvenlik seçildiğinde gün hücreleri Günlük Ücret alanları olur.
- Manuel giriş alanları hafif sarı-turuncu highlight olur.
- Kişi ekleme ekranında grup seçimi bulunur.

## Geriye Dönük Uyumluluk
- Eski `data.json` dosyaları açılır; grup alanı olmayan kişiler Personel sayılır.
- Mevcut personel verileri ve Muhasebe verileri kaybolmaz.

## Test
- Personel hesapları önceki sonuçlarla aynı kalır.
- Sanatçı ve Güvenlik toplamları günlük ücretlerin toplamıdır.
- Net ödeme formülü her iki grupta `toplam ücret - maaş - avans` olarak doğrulanır.
- Grup alanı olmayan eski çalışanların Personel olarak açıldığı doğrulanır.
- `data.json` kayıt ve yedekleme testleri korunur.
