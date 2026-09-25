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
- Kayıt gerektirmez; proje tarayıcıda saklanır. Ziyaretçi başına günlük ücretsiz AI hakkı (varsayılan 3)
- SEO: landing sayfası, `sitemap.xml`, `robots.txt`, Open Graph

## Kurulum (yerelde çalıştırma)

Gereksinim: Node.js 20+ (22 önerilir).

```bash
npm install
cp .env.example .env.local     # ANTHROPIC_API_KEY değerini doldur (AI özellikleri için)
npm run dev                    # http://localhost:3000
```

`ANTHROPIC_API_KEY` boş bırakılırsa uygulama yine çalışır; yalnızca AI butonları "AI özellikleri kapalı" uyarısı verir.
Anahtar: <https://console.anthropic.com> → API Keys.

## Yayınlama (Vercel)

1. Bu depoyu GitHub'a yükle.
2. <https://vercel.com/new> → depoyu seç → **Environment Variables** bölümüne `.env.example`'daki değişkenleri gir.
3. Deploy. Özel alan adı (`prompter.monster`) için Vercel → Settings → Domains.

## Proje yapısı

```
src/
  app/
    page.tsx              # landing
    studio/page.tsx       # Studio (4 adımlı sihirbaz)
    api/enhance/route.ts  # Claude: açıklamayı güçlendir
    api/suggest/route.ts  # Claude: stack öner (JSON)
    api/refine/route.ts   # Claude: promptu iyileştir (stream)
    sitemap.ts, robots.ts, layout.tsx, globals.css
  components/studio/      # Nav, Sidebar, StepBar, Step1..4, OutputPanel, Footer, useStudio
  lib/
    data.ts               # proje tipleri, stack, özellikler, ödeme, 12 uzman, varsayılan proje
    prompt.ts             # prompt üretici (uzman promptu, mega chain, export'lar)
    ai.ts                 # Anthropic SDK sarmalayıcı + guard (sunucu)
    ratelimit.ts          # günlük IP bazlı kota (Faz 1: bellek içi)
    client.ts             # tarayıcı tarafı API çağrıları, indirme, kopyalama
supabase/migrations/      # Faz 2 şeması (henüz bağlı değil)
```

## Yol haritası

| Faz | Kapsam | Durum |
| --- | --- | --- |
| 0 | Next.js iskeleti, README, env, SEO | ✅ |
| 1 | Studio taşıma + gerçek Claude API + export'lar | ✅ |
| 2 | Supabase Auth, proje kütüphanesi, versiyon geçmişi, hesaba bağlı kredi | 🔜 |
| 3 | Stripe/Paddle + Iyzico ödeme, paylaşılabilir prompt sayfası, programmatic SEO, lansman | 🔜 |

## Katkı ve lisans

Hata/öneri için Issues. Lisans: bkz. `LICENSE`.

---

## English

**Prompt.Monster** turns a product idea into expert-grade *master build prompts* for AI coding tools (Claude Code, Cursor, Windsurf, v0, Lovable, Bolt).
Twelve expert personas each add their own task block; output includes architecture, feature matrix, payment flow, constraints and success criteria.

**Run locally:** `npm install && cp .env.example .env.local && npm run dev` — add `ANTHROPIC_API_KEY` to enable the AI features (Enhance, stack suggestion, prompt refinement).
Without a key the app still works in template mode.

**Deploy:** import the repo on Vercel and set the env vars from `.env.example`.

Roadmap: Phase 2 adds accounts + project library (Supabase); Phase 3 adds payments (Stripe/Paddle + Iyzico) and shareable prompt pages.
