/**
 * Content for /docs (human guide) and /llms.txt (machine guide). Single source so both stay in sync.
 */
import { EXPERTS, FORMATS, MEGA_CHAIN_STEPS, PROJECT_CATEGORIES } from "./data";
import { TYPE_PAGES } from "./seo-types";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

export interface FieldGuide {
  field: string;
  step: 1 | 2 | 3 | 4;
  what: string;
  how: string;
  good: string;
  bad: string;
}

export const FIELD_GUIDE: FieldGuide[] = [
  {
    field: "Proje adı",
    step: 1,
    what: "Ürünün adı; prompt başlığına ve dosya adlarına girer.",
    how: "Kısa, telaffuz edilebilir, markalanabilir. Belirsizse 'Çalışma adı' yaz; sonra değiştirebilirsin.",
    good: "Kiracım",
    bad: "Proje 1 / deneme / benim uygulamam",
  },
  {
    field: "Tek cümlelik pitch",
    step: 1,
    what: "Ürünü bir cümlede anlatan söz; her uzman promptunun 'Hedef' satırı olur.",
    how: "[Kim] için [ne] yapan, [neden farklı] kalıbını kullan. 12–20 kelime. Sayı ve karşılaştırma varsa güçlenir.",
    good: "Küçük ev sahipleri için kira tahsilatını ve sözleşme takibini WhatsApp üzerinden otomatikleştiren asistan",
    bad: "Kira uygulaması",
  },
  {
    field: "Açıklama",
    step: 1,
    what: "Ürün vizyonu; mimari, PRD ve tasarım kararlarının dayandığı metin.",
    how: "100–200 kelime. Sırayla: kullanıcı kim, bugün sorunu nasıl çözüyor, ürün ne yapıyor, ilk sürümde neler VAR ve neler YOK, başarı ölçütü. 'Enhance' düğmesi bunu Claude ile toparlar; önce kendi cümlelerini yaz.",
    good: "Ev sahibi kiracıyı ekler, sözleşmeyi yükler; sistem her ay hatırlatır, ödemeyi Iyzico linkiyle alır, geciken için otomatik ihtar taslağı hazırlar. İlk sürümde muhasebe entegrasyonu yok…",
    bad: "Modern, hızlı ve kullanıcı dostu bir platform olacak. Her şeyi yapabilecek.",
  },
  {
    field: "Hedef kitle (rol, acı, bütçe)",
    step: 1,
    what: "PM ve Growth uzmanları personayı buradan kurar; fiyatlandırma bütçeye göre önerilir.",
    how: "Rol: unvan ya da durum. Acı: bugün kaybettiği zaman/para. Bütçe: aylık ödeyebileceği aralık.",
    good: "Rol: 2–10 dairesi olan bireysel ev sahibi • Acı: her ay 5 kiracıyı tek tek aramak • Bütçe: ₺300–900/ay",
    bad: "Herkes • Zaman kaybı • Uygun",
  },
  {
    field: "Rakipler",
    step: 1,
    what: "Konumlandırma ve 'ASLA YAPMA' kısıtları için referans.",
    how: "3 isim yeter. Doğrudan rakip yoksa 'bugünkü çözüm' yaz (Excel, WhatsApp grubu, muhasebeci).",
    good: "Excel + WhatsApp, Emlakjet Yönetim, Kiracım.app",
    bad: "Yok / bilmiyorum",
  },
  {
    field: "USP",
    step: 1,
    what: "Neden bu ürün? Copy ve Design uzmanları mesajı buradan çıkarır.",
    how: "Bir cümle, ölçülebilir fark: hız, fiyat, kanal, otomasyon derecesi.",
    good: "Kurulum 3 dakika; kiracı hiçbir uygulama indirmez, her şey WhatsApp'ta.",
    bad: "Daha iyi ve daha kolay.",
  },
  {
    field: "Monetizasyon",
    step: 1,
    what: "Gelir modeli; fiyatlandırma ve faturalandırma görevleri buna göre yazılır.",
    how: "1–2 seç. Emin değilsen 'Subscription + Freemium' güvenli başlangıçtır; pazar yerlerinde 'Commission %'.",
    good: "Subscription (MRR) + Freemium",
    bad: "Hepsi seçili",
  },
  {
    field: "Teknoloji yığını",
    step: 2,
    what: "7 katman: frontend, backend, veritabanı, auth, AI, realtime/infra, arama.",
    how: "Proje tipine göre öneri hazır gelir ('AI öner' de var). Bildiğin yığında kal; AI aracının en iyi bildiği yığın Next.js + Postgres/Supabase'dir. Her katmanda 1 seçim yeter.",
    good: "Next.js 15 • Hono + CF Workers • Supabase • Supabase Auth • Claude • Resend",
    bad: "Her katmanda 3 seçenek (araç kararsız kalır)",
  },
  {
    field: "Özellikler",
    step: 3,
    what: "Her özellik prompt'ta 'Spec + API + UI + Test' satırı olur; Mega Chain 5. adım bunları sırayla yapar.",
    how: "İlk sürüm için 5–12 özellik. Auth + çekirdek akış + faturalandırma üçlüsü yeterlidir; 'Realtime', 'AI Copilot' gibi ağırları 2. sürüme bırak.",
    good: "Email/Pass + Magic Link, Dashboard, Advanced CRUD, Notifications Center, Billing & Subscriptions",
    bad: "30 özelliğin tamamı",
  },
  {
    field: "Ödeme sağlayıcı ve uyum",
    step: 3,
    what: "Ödeme akışı ve compliance kısıtları (KVKK/GDPR, 3D Secure, e-Fatura…) prompt'a girer.",
    how: "Türkiye'ye satıyorsan Iyzico/PayTR + 3D Secure; globalse Stripe ya da Lemon Squeezy (vergi derdi yok). KVKK/GDPR'ı her zaman seç.",
    good: "Iyzico + Stripe • KVKK/GDPR • 3D Secure",
    bad: "8 sağlayıcının hepsi",
  },
  {
    field: "Uzmanlar",
    step: 4,
    what: "Her uzman kendi görev bloğunu, kısıtlarını ve başarı kriterlerini yazar.",
    how: "3–5 uzman ideal (Free'de 3, Pro'da 12). Çekirdek: CTO + PM + Design. Ürün tipine göre ekle: AI ürünüyse AI Engineer, fintech ise Security, pazaryeriyse Monetization, içerik ürünüyse SEO/AEO.",
    good: "CTO, PM, Design, Security, Monetization (fintech için)",
    bad: "Yalnız CTO (PRD ve tasarım kararları eksik kalır)",
  },
  {
    field: "Format ve dil",
    step: 4,
    what: "Çıktının hangi araca gideceği.",
    how: "Claude Code / Claude → Claude XML. ChatGPT / Gemini → ChatGPT Markdown. Cursor → Cursor Rules (.cursorrules). v0 → v0. Lovable ve Bolt → Lovable/Bolt. Aracın arayüz dili İngilizceyse çıktı dilini EN seç; kod yorumları da o dilde olur.",
    good: "Claude Code kullanıyorum → Claude XML + TR",
    bad: "v0'ya Claude XML yapıştırmak",
  },
];

export const TOOL_GUIDE: { tool: string; format: string; how: string[] }[] = [
  { tool: "Claude Code", format: "Claude XML (+ CLAUDE.md indir)", how: ["CLAUDE.md dosyasını deponun köküne koy.", "Mega Chain'i tek seferde değil adım adım ver: 'Adım 1: PRD' … 'Adım 8: Lansman'.", "Her adımın çıktısını onayladıktan sonra bir sonrakine geç; hataları aynı oturumda düzelttir."] },
  { tool: "Cursor / Windsurf", format: "Cursor Rules (.cursorrules indir)", how: [".cursorrules dosyasını proje köküne koy; Composer'da 'Adım 3: DB Schema & API Contract' diye başlat.", "Uzman bloklarını ayrı sohbetlerde kullan: önce CTO (mimari), sonra PM (PRD), sonra Design."] },
  { tool: "v0 / Lovable / Bolt", format: "v0 ya da Lovable/Bolt", how: ["Tek prompt kutusuna yapıştır; ilk turda yalnız Design + PM bloklarını ver, mimariyi ikinci turda ekle.", "Ekran başına iterasyon yap: 'Dashboard ekranını Step 2'deki design system'e göre yeniden yaz'."] },
  { tool: "ChatGPT / Gemini", format: "ChatGPT Markdown", how: ["Yeni sohbet + prompt; 'Önce PRD'yi yaz, onaylayınca şemaya geç' de.", "Kod üretimi için ChatGPT'nin Canvas / Gemini'nin Code modunu aç."] },
];

export const AGENT_GUIDE = {
  quickStart: `${SITE}/studio?type=<projectTypeId>`,
  typeIds: PROJECT_CATEGORIES.flatMap((c) => c.items.map((i) => ({ id: i.id, name: i.name, page: `${SITE}/prompt/${TYPE_PAGES.find((p) => p.id === i.id)?.slug ?? ""}` }))),
  shareApi: `${SITE}/api/share/<slug>`,
  formats: [...FORMATS],
  experts: EXPERTS.map((e) => ({ id: e.id, role: e.role, spec: e.spec })),
  chain: [...MEGA_CHAIN_STEPS],
};

/** Plain-text guide for AI agents (llms.txt). */
export function llmsTxt(): string {
  const lines: string[] = [];
  lines.push("# Prompt.Monster");
  lines.push("");
  lines.push("> Prompt.Monster turns a product idea into a production-grade \"master build prompt\" for AI coding tools (Claude Code, Cursor, v0, Lovable, Bolt, ChatGPT). Twelve expert personas (CTO, PM, Design Director, AI Engineer, Security, Monetization, SEO/AEO, DevOps, QA, Data, Growth, Copy) each write their block; an 8-step Mega Chain sequences the build. Interface: Turkish and English (/en); outputs in TR or EN.");
  lines.push("");
  lines.push("## How the Studio works (4 steps)");
  lines.push("1. Idea & vision: name, one-line pitch, description (100–200 words), audience (role, pain, budget), competitors, USP, monetization.");
  lines.push("2. Stack: 7 layers (frontend, backend, database, auth, AI, realtime/infra, search) — a suggestion per project type is pre-filled.");
  lines.push("3. Features & payments: 5–12 features for v1, payment providers (Stripe, Lemon Squeezy, Paddle, Iyzico, PayTR…), compliance (KVKK/GDPR, SOC2, 3D Secure, e-Fatura, PCI).");
  lines.push("4. Experts & generate: pick 3–5 experts (Free: 3, Pro: 12), output format, language → copy / download / share.");
  lines.push("");
  lines.push("## Filling the fields well (summary)");
  for (const f of FIELD_GUIDE) lines.push(`- ${f.field} (step ${f.step}): ${f.how} Good: "${f.good}". Avoid: "${f.bad}".`);
  lines.push("");
  lines.push("## Output formats → tools");
  for (const t of TOOL_GUIDE) lines.push(`- ${t.tool}: ${t.format}. ${t.how.join(" ")}`);
  lines.push("");
  lines.push("## Mega Chain steps");
  MEGA_CHAIN_STEPS.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");
  lines.push("## Experts");
  for (const e of EXPERTS) lines.push(`- ${e.id}: ${e.role} — ${e.spec}`);
  lines.push("");
  lines.push("## URLs for agents");
  lines.push(`- Quick start with a project type's presets: ${SITE}/studio?type=<id>  (ids below)`);
  lines.push(`- Blank project: ${SITE}/studio?new=1`);
  lines.push(`- Public share pages: ${SITE}/p/<slug>  (JSON: ${SITE}/api/share/<slug> → {name, version, format, lang, experts, output, state})`);
  lines.push(`- Project-type landing pages (recommended experts, stack, features, sample prompt, FAQ): ${SITE}/prompt/<slug>`);
  lines.push(`- Pricing: ${SITE}/pricing  • Guide: ${SITE}/docs  • Sitemap: ${SITE}/sitemap.xml`);
  lines.push("");
  lines.push("## Project type ids");
  for (const c of PROJECT_CATEGORIES) {
    for (const i of c.items) {
      const p = TYPE_PAGES.find((x) => x.id === i.id);
      lines.push(`- ${i.id}: ${i.name}${p ? ` — ${SITE}/prompt/${p.slug}` : ""}`);
    }
  }
  lines.push("");
  lines.push("## Plans");
  lines.push("- Free: 3 experts, 2 formats (ChatGPT Markdown, Claude XML), 5 AI credits/day (visitors without an account: 3), project library, share pages. No card.");
  lines.push("- Monster Pro ($29/mo or $290/yr): 12 experts, Mega Chain, 5 formats, project files for coding agents (AGENTS.md, CLAUDE.md, .claude/agents, Cursor rules, Copilot instructions, Task Master PRD), Export to Builders, 1,000 AI credits/month (enhance 1, stack suggestion 1, refine 3; max 150/day).");
  lines.push("");
  lines.push("## MCP server (Streamable HTTP)");
  lines.push(`- Endpoint: ${SITE}/api/mcp  — works without a key (Free plan); add "Authorization: Bearer pm_live_…" for your plan, refine and file exports. Keys: ${SITE}/account/api`);
  lines.push(`- Claude Code: claude mcp add --transport http prompt-monster ${SITE}/api/mcp --header "Authorization: Bearer <key>"`);
  lines.push("- Tools: list_project_types, get_type_preset, list_experts, generate_build_prompt (free, deterministic), export_files (Pro: AGENTS.md, CLAUDE.md, .claude/agents/*.md, .cursor/rules/*.mdc, .cursorrules, .github/copilot-instructions.md, .taskmaster/docs/prd.txt, prompt-monster.json), get_shared_prompt, refine_prompt (key, 3 AI credits).");
  lines.push("- Prompt: new_project (idea → master build prompt; in Claude Code: /mcp__prompt-monster__new_project).");
  lines.push("");
  lines.push("## REST API");
  lines.push(`- Base: ${SITE}/api/v1  • OpenAPI 3.1: ${SITE}/api/v1/openapi.json  • Docs: ${SITE}/developers (EN: ${SITE}/en/developers)`);
  lines.push("- GET /types, GET /types/{id}, POST /generate {name, pitch, description, projectType, features, experts, format, lang, output: mega|experts|files}, POST /refine (key), GET /shared/{slug}.");
  lines.push("- Limits: 10 requests/min without a key, 30/min with a key. Errors: { error: { code, message } }.");
  lines.push("");
  lines.push("## Languages");
  lines.push(`- Turkish at the root, English under ${SITE}/en (studio, pricing, docs, prompt pages, developers).`);
  lines.push("- Contact: hello@prompter.monster");
  return lines.join("\n") + "\n";
}
