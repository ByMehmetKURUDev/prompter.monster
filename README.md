# 👹 Prompt.Monster

**Fikrini anlat, canavar build prompt'unu yazsın.**

Prompt.Monster, bir ürün fikrini 12 uzman persona (CTO, PM, Design, AI, Monetization, SEO/AEO, DevOps, Security, Copy, Data, QA, Growth) ile
**Claude Code, Cursor, Windsurf, v0, Lovable ve Bolt**'a doğrudan yapıştırılacak *master build prompt*'lara çeviren bir web uygulamasıdır.
Mimari, özellik matrisi, ödeme akışı (Stripe, Iyzico, PayTR…), kısıtlar ve başarı kriterleri dahil.

> Türkçe aşağıda · [English below](#english)

---

## Özellikler (v3.0 — Faz 1)

- **4 adımlı Studio:** Fikir & Vizyon → Teknoloji & Mimari → Özellikler & Ödeme → Uzmanlar & Üret
- **24 proje tipi**, 15+ hazır şablon, 7 katmanlı stack seçimi, 30+ özellik, 8 ödeme sağlayıcı, KVKK/GDPR/SOC2 uyum etiketleri
- **12 uzman canavar** — her biri kendi görev bloğunu prompt'a ekler
- **5 çıktı formatı:** ChatGPT Markdown, Claude XML, Cursor Rules, v0, Lovable/Bolt · **TR / EN**
- **Mega Chain:** 8 adımlı zincir + tek parça master prompt
- **Gerçek AI (Claude):** açıklamayı güçlendir (*Enhance*), stack öner, üretilen promptu iyileştir (*streaming*)
- **Export:** `.md`, `.json`, `.cursorrules`, `CLAUDE.md`, `.txt` indir; "Export to Builders" ile araç formatında kopyala
- **Hesap ve kütüphane (Faz 2):** e-posta/şifre veya sihirli bağlantı ile giriş (Supabase Auth), "Kaydet" ile proje kütüphanesi, her üretim bir versiyon olarak saklanır, versiyonlar arasında geçiş, hesaba bağlı günlük AI hakkı (free 3, pro 200)
- **Paylaşılabilir prompt sayfası (Faz 3.1):** her versiyon "Paylaş" ile herkese açık `/p/<slug>` sayfası olur (kopyala / indir / "Studio'da çatalla"), Open Graph etiketleri ve sitemap ile arama motorlarına açık
- **Monster Pro (Faz 3.2):** Lemon Squeezy (Merchant of Record) ile $29/ay veya $290/yıl abonelik; `/pricing`, hosted checkout, webhook ile `profiles.plan` güncellemesi, müşteri portalı. Free: 3 uzman, 2 format, günde 3 AI çağrısı; Pro: 12 uzman, Mega Chain, 5 format, Export to Builders, günde 200 AI çağrısı (`src/lib/plans.ts`)
- **Programmatic SEO (Faz 3.2):** 22 proje tipi için statik landing sayfası `/prompt/<slug>` (önerilen uzmanlar, stack, özellikler, kısaltılmış örnek prompt, SSS + FAQPage/Breadcrumb JSON-LD) ve `/prompt` hub'ı; her sayfa Studio'yu `?type=<id>` ile o tipin ön ayarlarıyla açar
- Kayıt gerektirmez; ziyaretçi projesi tarayıcıda saklanır, günlük ücretsiz AI hakkı IP bazlı (varsayılan 3)
- SEO: landing sayfası, `sitemap.xml`, `robots.txt`, Open Graph

## Kurulum (yerelde çalıştırma)

Gereksinim: Node.js 20+ (22 önerilir).

```bash
npm install
cp .env.example .env.local     # ANTHROPIC_API_KEY değerini doldur (AI özellikleri için)
npm run dev                    # http://localhost:3000
```

`ANTHROPIC_API_KEY` boş bırakılırsa uygulama yine çalışır; yalnızca AI butonları "AI özellikleri henüz açık değil" uyarısı verir.
`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` herkese açık değerlerdir ve `.env.production` içinde gelir; yerelde kendi Supabase projenizi kullanmak için `.env.local`'e yazın.
Şema için `supabase/migrations/` altındaki dosyaları sırayla (0001, 0002…) Supabase SQL Editor'da çalıştırın; Authentication → URL Configuration'da site URL ve `.../auth/callback` yönlendirmesini ekleyin.
E-posta doğrulama ve sihirli bağlantı için Authentication → Emails → SMTP Settings'te özel SMTP tanımlayın (canlıda Resend: `smtp.resend.com:465`, kullanıcı `resend`, şifre = Resend API anahtarı) ve
"Confirm sign up" / "Magic link" şablonlarındaki bağlantıyı `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup|magiclink&next=/studio` yapın (sunucu tarafı doğrulama, PKCE uyumlu).
Anahtar: <https://console.anthropic.com> → API Keys.

## Yayınlama (Cloudflare Workers — canlı ortam)

Site, [OpenNext Cloudflare adaptörü](https://opennext.js.org/cloudflare) ile Cloudflare Workers'ta çalışır; yapılandırma `wrangler.jsonc` içinde
(özel alan adları `prompter.monster` + `www`, `RATE_LIMIT` KV binding'i, `ANTHROPIC_MODEL` / `FREE_AI_CALLS_PER_DAY` değişkenleri).

```bash
npx wrangler login                          # bir kez: tarayıcıda Cloudflare hesabını onayla
npx wrangler secret put ANTHROPIC_API_KEY   # bir kez: anahtarı gizli değişken olarak kaydet
npm run deploy                              # build + deploy (prompter.monster ve www rotaları otomatik bağlanır)
npm run preview                             # yayınlamadan önce Workers ortamında yerel önizleme (macOS 13.5+ / Linux)
```

Not: `npm run deploy`, `wrangler deploy`'u doğrudan çağırır (`OPEN_NEXT_DEPLOY=true`); böylece yerel Workers çalışma zamanı (workerd) gerekmez ve
macOS 12 gibi eski sistemlerde de çalışır. Incremental cache (R2/KV) eklendiğinde `npm run deploy:full` kullanılmalıdır.

Her `main` push'unda otomatik yayın için Cloudflare panelinde **Workers & Pages → prompter-monster → Settings → Builds** altından
GitHub deposu bağlanabilir (build komutu: `npx opennextjs-cloudflare build`, deploy komutu: `npx opennextjs-cloudflare deploy`).

### Alternatif: Vercel

1. <https://vercel.com/new> → depoyu seç → **Environment Variables** bölümüne `.env.example`'daki değişkenleri gir.
2. Deploy. Alan adını Cloudflare DNS'te Vercel'in verdiği CNAME/A kaydıyla bağla.

## Proje yapısı

```
src/
  app/
    page.tsx              # landing
    studio/page.tsx       # Studio (4 adımlı sihirbaz)
    api/enhance/route.ts  # Claude: açıklamayı güçlendir
    api/suggest/route.ts  # Claude: stack öner (JSON)
    api/refine/route.ts   # Claude: promptu iyileştir (stream)
    api/me/route.ts       # oturum + günlük AI hakkı
    api/projects/         # proje kaydet/listele/aç/sil (RLS ile kullanıcıya özel)
    login/, library/      # giriş sayfası, Projelerim
    p/[slug]/page.tsx     # herkese açık paylaşılan prompt sayfası
    pricing/page.tsx      # Free vs Pro, Lemon Squeezy checkout (ProCta)
    prompt/, prompt/[slug]/ # programmatic SEO: proje tipi başına statik landing sayfaları
    api/billing/          # checkout, webhook (X-Signature), portal, status, interest
    account/password      # şifre belirleme/sıfırlama
    api/share/            # paylaşım bağlantısı oluştur/sil, herkese açık okuma (çatallama)
    auth/callback, auth/signout
    sitemap.ts, robots.ts, layout.tsx, globals.css
  components/studio/      # Nav, Sidebar, StepBar, Step1..4, OutputPanel, Footer, useStudio
  middleware.ts           # Supabase oturum yenileme + /library koruması
  lib/
    supabase/             # browser/server/middleware istemcileri
    data.ts               # proje tipleri, stack, özellikler, ödeme, 12 uzman, varsayılan proje
    plans.ts              # Free/Pro yetkileri (uzman sayısı, formatlar, Mega Chain, builders)
    type-presets.ts       # proje tipi başına önerilen uzman/özellik/ödeme/stack (Studio ?type=)
    seo-types.ts, seo.ts  # /prompt/[slug] sayfa içerikleri ve yardımcıları
    billing/lemonsqueezy.ts # checkout, abonelik, webhook imzası, variant keşfi
    prompt.ts             # prompt üretici (uzman promptu, mega chain, export'lar)
    ai.ts                 # Anthropic SDK sarmalayıcı + guard (sunucu)
    ratelimit.ts          # günlük IP bazlı kota (Cloudflare KV; yerelde bellek içi)
    client.ts             # tarayıcı tarafı API çağrıları, indirme, kopyalama
supabase/migrations/      # veritabanı şeması (profiles, projects, generations, RLS, kota fonksiyonları)
wrangler.jsonc            # Cloudflare Workers yapılandırması (alan adı, KV, değişkenler)
open-next.config.ts       # OpenNext adaptör ayarları
```

## Yol haritası

| Faz | Kapsam | Durum |
| --- | --- | --- |
| 0 | Next.js iskeleti, README, env, SEO | ✅ |
| 1 | Studio taşıma + gerçek Claude API + export'lar + Cloudflare Workers yayını | ✅ |
| 2 | Supabase Auth, proje kütüphanesi, versiyon geçmişi, hesaba bağlı kredi, özel SMTP (Resend) | ✅ |
| 3.1 | Paylaşılabilir prompt sayfası `/p/[slug]` + çatallama + sitemap | ✅ |
| 3.2 | Lemon Squeezy ile Monster Pro, Free/Pro ayrımı üründe, programmatic SEO (`/prompt/[slug]`) | ✅ |
| 3.3 | Lemon Squeezy mağaza aktivasyonu + canlı mod, Anthropic anahtarı, lansman (Product Hunt / X) | 🔜 |

## Katkı ve lisans

Hata/öneri için Issues. Lisans: bkz. `LICENSE`.

---

## English

**Prompt.Monster** turns a product idea into expert-grade *master build prompts* for AI coding tools (Claude Code, Cursor, Windsurf, v0, Lovable, Bolt).
Twelve expert personas each add their own task block; output includes architecture, feature matrix, payment flow, constraints and success criteria.

**Run locally:** `npm install && cp .env.example .env.local && npm run dev` — add `ANTHROPIC_API_KEY` to enable the AI features (Enhance, stack suggestion, prompt refinement).
Without a key the app still works in template mode.

**Deploy:** `npx wrangler login`, `npx wrangler secret put ANTHROPIC_API_KEY`, then `npm run deploy` (Cloudflare Workers via OpenNext; custom domain wired from `wrangler.jsonc`). Vercel also works: import the repo and set the env vars from `.env.example`.

Roadmap: Phase 2 (accounts, project library, versions, custom SMTP), Phase 3.1 (public shareable prompt pages at `/p/[slug]` with one-click fork) and Phase 3.2 (Monster Pro via Lemon Squeezy, Free/Pro entitlements, programmatic SEO pages at `/prompt/[slug]`) are live; Phase 3.3 is store activation (live mode) and launch.
