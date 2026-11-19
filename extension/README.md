# Prompter.Monster — Tek Tık Aktar / One-Click Paste

Chrome eklentisi · Chrome extension — https://prompter.monster/extensions

## Kurulum (1 dakika)

1. Bu klasörü silmeyeceğin bir yere koy: Chrome eklentiyi buradan çalıştırır.
2. Chrome'da `chrome://extensions` adresini aç (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Sağ üstte **Geliştirici modu**nu aç.
4. **Paketlenmemiş öğe yükle**'ye tıkla ve bu klasörü seç.
5. Yapboz simgesinden Prompter.Monster'ı sabitle.

**Kullanım:** Prompter.Monster Studio'da bir prompt'u kopyala, ChatGPT, Claude, Gemini… sekmesine geç,
eklenti simgesine tıkla ve **Panodakini Yapıştır**'a bas. İstersen "Yapıştırdıktan sonra otomatik
gönder"i aç (varsayılan kapalı).

**Güncelleme:** yeni sürümü https://prompter.monster/extensions adresinden indir, bu klasörün yerine
koy ve `chrome://extensions` sayfasında eklentinin ↻ (yenile) düğmesine bas.

## Install (1 minute)

1. Keep this folder somewhere you won't delete it: Chrome runs the extension from here.
2. Open `chrome://extensions` in Chrome (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** in the top right corner.
4. Click **Load unpacked** and pick this folder.
5. Pin Prompter.Monster from the puzzle icon.

**Use:** copy a prompt in the Prompter.Monster Studio, switch to a ChatGPT, Claude, Gemini… tab, click
the extension icon and press **Paste from Clipboard**. Turn on "Auto-send after pasting" if you like
(off by default).

**Update:** download the new version from https://prompter.monster/extensions, replace this folder and
press the extension's ↻ (reload) button on `chrome://extensions`.

## İzinler ve gizlilik / Permissions and privacy

| İzin / Permission | Neden / Why |
| --- | --- |
| `activeTab`, `scripting` | Yalnız simgeye tıkladığın sekmede, metni mesaj kutusuna yazmak için; kalıcı site erişimi yok. / Only on the tab where you click the icon, to write the text into the message box; no standing site access. |
| `clipboardRead` | Pano yalnız Yapıştır'a bastığında okunur. / The clipboard is read only when you press Paste. |
| `storage` | "Otomatik gönder" ayarını hatırlar. / Remembers the auto-send setting. |

Veri toplamaz, hiçbir sunucuya bir şey göndermez. / Collects no data and sends nothing to any server.

---

## Geliştirici notları

### Nasıl çalışır

Prompter.Monster sitesinde değişiklik gerektirmiyor: site zaten her yerde bir "Kopyala" düğmesi
sunuyor (`src/lib/client.ts#copyText`), eklenti bunu tamamlıyor.

1. Kullanıcı Prompter.Monster'da bir bölümü kopyalar.
2. ChatGPT/Claude/Gemini gibi bir sekmede eklenti simgesine tıklar.
3. Popup (`popup/popup.js`), kullanıcı tıklamasıyla `navigator.clipboard.readText()` çağırıp panoyu okur.
4. `chrome.scripting.executeScript` ile yalnız o anki sekmeye (**activeTab**; kalıcı
   `host_permissions` yok) metni mesaj kutusuna yazan bir fonksiyon enjekte eder.
5. Fonksiyon önce bilinen siteler için ipucu seçicileri dener (ChatGPT `#prompt-textarea`, Claude
   ProseMirror, Gemini `.ql-editor`…), bulamazsa sayfadaki en büyük görünür `textarea` /
   `contenteditable` öğesini hedefler; bu yüzden listede olmayan sitelerde de çoğunlukla çalışır.

### Dil

- Ad, kısa ad, açıklama ve simge ipucu `_locales/{tr,en}/messages.json`'da (`__MSG_…__`);
  `default_locale` İngilizce. Manifest'te `default_locale` varsa `_locales` klasörü şart, yoksa
  Chrome eklentiyi yüklemez (1.0.0'daki hata buydu).
- Popup metinleri `popup/popup.js#COPY`: tarayıcı dili Türkçeyse Türkçe, değilse İngilizce.

### Dağıtım

- Sitedeki indirme (`/downloads/prompter-monster-chrome.zip`) her build'de
  `scripts/build-extension-zips.mjs` ile bu klasörden üretilir; zip'in içinde tek bir
  `prompter-monster-chrome/` klasörü var. Sürümü `manifest.json#version`'dan yükselt, sayfa onu
  gösterir (`src/lib/extensions.ts`).
- Chrome Web Store (kullanıcı aksiyonu, henüz yapılmadı): https://chrome.google.com/webstore/devconsole
  → tek seferlik 5 USD kayıt. Mağaza zip'inde `manifest.json` kökte olmalı:
  `cd extension && zip -r ../prompter-monster-chrome-store.zip . -x '*.DS_Store'`. Listeleme için
  ad/açıklama (`_locales`), en az 1 ekran görüntüsü (1280×800 ya da 640×400), gizlilik beyanı
  ("veri toplanmıyor"). Onaylanınca mağaza adresini `src/lib/extensions.ts#CHROME_EXTENSION.storeUrl`'e
  yaz; sayfa mağazayı ana düğme yapar.
- Edge ve Firefox mağazaları ayrı (ücretsiz) hesap ve gönderim ister; kapsam dışında.

### Bilinen sınırlamalar

- Chromium tabanlı masaüstü tarayıcılar için (Manifest V3); Firefox ve Safari'de çalışmaz.
- Hedef sitelerin arayüzü değişirse `popup/popup.js` içindeki `hints` seçicileri güncellemek
  gerekebilir; genel yedek mantık (en büyük görünür metin kutusu) çoğu değişikliği tolere eder.
- "Otomatik gönder" varsayılan olarak kapalı.
