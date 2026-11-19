# Prompter.Monster — Raycast eklentisi / Raycast extension

Mac · Beta — https://prompter.monster/extensions#raycast

## Kurulum (Mac, 2–3 dakika)

Gerekenler: Raycast 1.26 veya üstü (https://raycast.com), Node.js 22.14 veya üstü (https://nodejs.org, LTS).

1. Bu klasörü kalıcı bir yere koy (ör. Belgeler); güncellerken yine bunu kullanırsın.
2. Terminal'i aç, `cd ` yaz (sonunda bir boşluk), klasörü Terminal penceresine sürükle ve Enter'a bas.
3. Şu komutu çalıştır:

   ```
   npm install && npm run dev
   ```

4. Raycast açılır; **Generate Build Prompt** ve **Browse Project Types** komutları listenin en üstünde.
   Terminal'de Ctrl+C'ye bas: eklenti Raycast'te kalır.
5. İsteğe bağlı: Raycast Ayarları → Extensions → Prompter.Monster → **API Key** alanına
   https://prompter.monster/account/api adresinden aldığın `pm_live_…` anahtarını yapıştır (Pro
   sınırları). **Language** ile TR/EN seç.

Güncelleme: yeni zip'i indir, bu klasörün yerine koy, 2. ve 3. adımı tekrarla.

## Install (Mac, 2–3 minutes)

You need Raycast 1.26 or later (https://raycast.com) and Node.js 22.14 or later (https://nodejs.org, LTS).

1. Keep this folder somewhere permanent (Documents, say); you'll use it again to update.
2. Open Terminal, type `cd ` (with a trailing space), drag this folder onto the Terminal window and press Enter.
3. Run:

   ```
   npm install && npm run dev
   ```

4. Raycast opens with **Generate Build Prompt** and **Browse Project Types** at the top of the list.
   Press Ctrl+C in Terminal: the extension stays in Raycast.
5. Optional: under Raycast Settings → Extensions → Prompter.Monster, paste a `pm_live_…` key from
   https://prompter.monster/account/api into **API Key** (Pro limits) and pick EN/TR under **Language**.

Update: download the new zip, replace this folder and repeat steps 2 and 3.

---

## Geliştirici notları

prompts.chat analizindeki 8. (ikincil) öneri: master prompt üretimini Raycast'in komut
paletinden tek adımda yapmak. Backend/DB değişikliği yok; yalnız sitenin herkese açık API'sini
(`/api/v1`, bkz. `prompter.monster/developers` ve `/api/v1/openapi.json`) çağırıyor: MCP sunucusunun
ve API anahtarları sayfasının kullandığı uç noktalar.

### Komutlar

- **Generate Build Prompt**: proje adı/pitch/açıklama + isteğe bağlı proje tipi, çıktı formatı ve
  dil; `POST /api/v1/generate` ile deterministik (AI kredisi harcamayan) bir master prompt üretir.
  Sonuç ekranında Kopyala / Yapıştır / Studio'da Aç.
- **Browse Project Types**: `GET /api/v1/types` ile proje tipi hazır ayarlarını kategoriye göre
  listeler; bir tipin id'sini kopyalayıp Generate komutunda kullanırsın.

### Tercihler

- **API Key** (isteğe bağlı): `pm_live_…`. Girilirse Monster Pro sınırları (18 uzman, her format);
  boşsa Free (3 uzman, yalnız ChatGPT Markdown / Claude XML). Anahtarsız da tamamen çalışır.
- **Language**: proje tipi listesi ve üretilen prompt için TR/EN.

### Doğrulama

- Sandbox'ta (Linux, Raycast yok) sitedeki zip'ten `npm ci` + `npx ray build -e dist` çalıştırıldı:
  derleme ve TypeScript kontrolü başarılı (20 Kas 2026). Gerçek Raycast arayüzündeki test Mac'te
  yapılmalı; bu yüzden sayfada "Beta".

### Dağıtım

- Sitedeki indirme (`/downloads/prompter-monster-raycast.zip`) her build'de
  `scripts/build-extension-zips.mjs` ile bu klasörden üretilir (`node_modules`, `dist`, yerel
  araç dosyaları hariç; `package-lock.json` dahil).
- Raycast Store (kullanıcı aksiyonu, henüz yapılmadı; ücretsiz): `package.json#author` Raycast
  kullanıcı adınla aynı olmalı (şu an `mehmetkuru_dev`). Bu klasörde `npm run lint`, sonra
  `npm run publish`: GitHub ile giriş ister ve `raycast/extensions` deposuna otomatik bir pull
  request açar; Raycast ekibi inceler, birleşince Store'da yayınlanır. Store sayfasını
  `src/lib/extensions.ts#RAYCAST_EXTENSION.storeUrl`'e yaz; sitedeki sayfa tek tıklık kurulumu
  ana düğme yapar. Store kuralları: https://developers.raycast.com/basics/prepare-an-extension-for-store

### Teknik notlar

- Kod, sitenin `src/lib/api-core.ts` / `src/app/api/v1/*` dosyalarındaki `GenerateInput` /
  `GenerateResult` / `ProjectType` şekillerine ve `/api/v1/openapi.json`'a dayanıyor; elle senkron.
- `output` her zaman `"mega"` (tek birleşik prompt); uzman başına prompt ve Pro dosya ihracı v1
  kapsamı dışında.
