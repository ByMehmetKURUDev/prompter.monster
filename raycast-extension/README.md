# Prompter.Monster — Raycast eklentisi

prompts.chat analizindeki 8. (ikincil) öneri: master prompt üretimini Raycast'in komut
paletinden tek adımda yapmak. Backend/DB değişikliği YOK — yalnızca sitenin zaten canlı
olan herkese açık API'sini (`/api/v1`, bkz. `prompter.monster/developers` ve
`/api/v1/openapi.json`) çağırıyor; MCP sunucusunun ve API anahtarları sayfasının kullandığı
aynı uç noktalar.

## Komutlar

- **Generate Build Prompt** — proje adı/pitch/açıklama + isteğe bağlı proje tipi, çıktı
  formatı ve dil al; `POST /api/v1/generate` ile deterministik (AI kredisi harcamayan) bir
  master prompt üretir. Sonuç ekranında Kopyala / Yapıştır / Studio'da Aç aksiyonları var.
- **Browse Project Types** — `GET /api/v1/types` ile proje tipi presetlerini kategoriye göre
  listeler, arama yapılabilir; bir tipin id'sini kopyalayıp Generate komutunda kullanabilirsin.

## Tercihler (Extension Preferences)

- **API Key** (isteğe bağlı) — `prompter.monster/account/api`'den alınan `pm_live_…` anahtarı.
  Girilirse Monster Pro sınırları geçerli olur (18 uzman, her format, dosya dışa aktarma).
  Boş bırakılırsa Free plan sınırları uygulanır (3 uzman, yalnız ChatGPT Markdown / Claude XML) —
  anahtar olmadan da tamamen çalışır.
- **Language** — proje tipi listesi ve üretilen prompt için TR/EN.

## Yerel test (geliştirici modu)

Raycast extension'ları geliştirmek/test etmek Raycast'in kendi `ray` CLI'ını ve macOS'ta
kurulu Raycast uygulamasını gerektiriyor — bu sandbox'ta (Linux, Raycast kurulu değil)
çalıştırılamıyor/doğrulanamıyor; `src/*.tsx` dosyaları `@raycast/api` tipleriyle `tsc --noEmit`
ile tip-doğrulaması yapıldı (bkz. aşağı), ama gerçek Raycast arayüzünde görsel/işlevsel test
kullanıcının kendi Mac'inde yapılması gerekiyor:

1. Mac'te Raycast kurulu değilse https://raycast.com adresinden kur (ücretsiz).
2. Bu klasörde (`raycast-extension/`) `npm install` çalıştır.
3. `npm run dev` (`ray develop`) — Raycast'i açar, eklentiyi geliştirme modunda yükler, kod
   değiştikçe otomatik yeniler. Komut paletinde (⌘ Space) "Generate Build Prompt" / "Browse
   Project Types" yazarak dene.
4. Beğenirsen Raycast Store'a göndermek (isteğe bağlı, kullanıcı aksiyonu): `npm run publish`
   (`npx @raycast/api publish`) — bir Raycast hesabı ve inceleme süreci gerektirir.

## Teknik notlar

- Kod, sitenin `src/lib/api-core.ts` / `src/app/api/v1/*` dosyalarındaki gerçek
  `GenerateInput`/`GenerateResult`/`ProjectType` şekillerine ve `/api/v1/openapi.json`'a
  dayanıyor — tahmini bir API sözleşmesi kullanılmadı.
- `output` her zaman `"mega"` gönderiliyor (tek birleşik prompt) — `experts`/`files` çıktıları
  (uzman başına ayrı prompt, Pro dosya ihracı) v1 kapsamı dışında bırakıldı, ikincil öncelikli
  bu özellik için kapsam bilerek dar tutuldu.
- `extension/` (tarayıcı eklentisi, #61) ile aynı ruh: sitenin kendisine hiçbir değişiklik
  gerektirmiyor, yalnızca var olan herkese açık yüzeyi (burada API, orada panoyu) kullanıyor.
