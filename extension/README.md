# Prompt.Monster — Tek Tık Aktar (tarayıcı eklentisi)

Studio'da ürettiğin master prompt'u (veya herhangi bir bölümünü) kopyaladıktan sonra,
ChatGPT / Claude / Gemini / Copilot / Perplexity gibi sohbet arayüzlerinde eklentinin
simgesine tıklayarak panodaki metni doğrudan mesaj kutusuna yapıştırır. "Otomatik gönder"
açıksa ayrıca gönderir.

## Nasıl çalışır (mimari)

Bu, prompter.monster sitesinin kendisine **hiçbir değişiklik gerektirmiyor**. Site zaten
her yerde bir "Kopyala" düğmesi sunuyor (`src/lib/client.ts#copyText`); eklenti bunu
tamamlıyor:

1. Kullanıcı Prompt.Monster'da bir bölümü kopyalar (var olan davranış, değişmedi).
2. ChatGPT/Claude/Gemini gibi bir sekmede eklenti simgesine tıklar.
3. Popup (`popup/popup.js`), kullanıcı etkileşimiyle tetiklenen `navigator.clipboard.readText()`
   çağrısıyla panoyu okur.
4. `chrome.scripting.executeScript` ile, yalnızca o anki aktif sekmeye (**activeTab** izni —
   kalıcı `host_permissions` yok), metni sayfanın mesaj kutusuna yazan bir fonksiyon enjekte eder.
5. Enjekte edilen fonksiyon önce bilinen siteler için ipucu seçiciler dener (ChatGPT'nin
   `#prompt-textarea`'sı, Claude'un ProseMirror editörü, Gemini'nin Quill tabanlı
   `.ql-editor`'ı…), bulamazsa sayfadaki en büyük görünür `textarea`/`contenteditable`
   elementini hedefler — bu sayede listelenmemiş bir site (Le Chat, Grok, DeepSeek, Poe…)
   üzerinde de genellikle çalışır.

Backend'e, API anahtarına ya da yeni bir veritabanı tablosuna ihtiyaç yok; tamamen
istemci tarafında çalışır ve prompter.monster dışında hiçbir sunucuya veri göndermez.

## Yerel test (geliştirici modu)

1. Chrome/Edge/Brave'de `chrome://extensions` adresine git.
2. Sağ üstten "Geliştirici modu"nu (Developer mode) aç.
3. "Paketlenmemiş öğe yükle" (Load unpacked) → bu `extension/` klasörünü seç.
4. Simge araç çubuğuna eklenir. Prompter.monster'da bir prompt'u kopyala, bir AI sohbet
   sekmesine geç, simgeye tıkla.

## Mağazaya yayınlama (kullanıcı aksiyonu — henüz yapılmadı)

Chrome Web Store'a yayınlamak, geliştirici hesabı sahibinin kendisinin yapması gereken
bir adım (bende bu hesaba erişim/ödeme yetkisi yok):

1. https://chrome.google.com/webstore/devconsole üzerinden tek seferlik 5 USD geliştirici
   kayıt ücretini öde (Google hesabıyla).
2. `extension/` klasörünü zip'le (`cd extension && zip -r ../prompt-monster-extension.zip .`)
   ve yükle.
3. Mağaza listelemesi için: başlık, açıklama (bu dosyadaki özet kullanılabilir), en az 1
   ekran görüntüsü (1280×800 ya da 640×400), gizlilik beyanı — eklenti hiçbir veri
   toplamadığı/sunucuya göndermediği için "No user data collected" seçilebilir.
4. İnceleme genelde birkaç gün sürer; onaylanınca herkese açık bir mağaza linki oluşur.

Edge ve Firefox mağazaları için ayrı (ücretsiz) geliştirici hesapları ve ayrı gönderimler
gerekir — v1 kapsamı dışında tutuldu.

## Bilinen sınırlamalar

- v1 Chrome/Edge/Brave (Chromium, Manifest V3) için yazıldı; Firefox'ta test edilmedi.
- Hedef sitelerin (ChatGPT, Claude, Gemini…) arayüzü değiştiğinde ipucu seçiciler
  (`popup/popup.js` içindeki `hints` dizisi) güncellenmesi gerekebilir — bu, bu
  kategorideki tüm "bir tıkla gönder" eklentilerinin ortak özelliği; genel-amaçlı
  yedek mantık (en büyük görünür metin kutusu) kırılmaları büyük ölçüde tolere eder.
- "Otomatik gönder" varsayılan olarak kapalı — kullanıcı metni görmeden gönderilmesini
  istemiyorsa açmaması önerilir.
