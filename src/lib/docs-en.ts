/**
 * English content for /docs (the Studio guide). Mirrors docs.ts entry by entry (same order, same steps), plus the
 * page's UI strings in both languages so src/app/docs/page.tsx can switch by locale (DOCS_UI_TR is copied verbatim
 * from that page). Turkey-specific examples (Iyzico, ₺, WhatsApp, local brands) are swapped for global equivalents
 * that teach the same point.
 */
import { AGENT_GUIDE, type FieldGuide } from "./docs";

export const FIELD_GUIDE_EN: FieldGuide[] = [
  {
    field: "Project name",
    step: 1,
    what: "Your product's name. It goes into the prompt title and file names.",
    how: "Short, easy to say, brandable. Not sure yet? Use a working title; you can change it later.",
    good: "RentNudge",
    bad: "Project 1 / test / my app",
  },
  {
    field: "One-line pitch",
    step: 1,
    what: "Your product in one sentence. It becomes the 'Goal' line of the prompt and shows up in every expert's brief.",
    how: "Use the pattern: [what it does] for [who], [why it's different]. 12–20 words. Numbers and comparisons make it stronger.",
    good: "An assistant that automates rent collection and lease tracking for small landlords, entirely over text message",
    bad: "Rent app",
  },
  {
    field: "Description",
    step: 1,
    what: "Your product vision: the text that architecture, PRD and design decisions are built on.",
    how: "100–200 words, in this order: who the user is, how they solve the problem today, what the product does, what's IN and what's OUT of v1, and how you'll measure success. The 'Enhance' button tightens it up with Claude, but write it in your own words first.",
    good: "The landlord adds a tenant and uploads the lease; every month the system sends a reminder, collects rent through a Stripe payment link and drafts a late notice automatically when a payment is overdue. No accounting integration in v1…",
    bad: "It'll be a modern, fast and user-friendly platform. It will do everything.",
  },
  {
    field: "Target audience (role, pain, budget)",
    step: 1,
    what: "The PM and Growth experts build the persona from this, and pricing is suggested based on the budget.",
    how: "Role: a job title or situation. Pain: the time or money they lose today. Budget: the monthly range they can pay.",
    good: "Role: independent landlord with 2–10 units • Pain: chasing 5 tenants for rent one by one, every month • Budget: $10–30/mo",
    bad: "Everyone • Wasted time • Affordable",
  },
  {
    field: "Competitors",
    step: 1,
    what: "A reference point for positioning and for the 'NEVER DO' constraints.",
    how: "Three names are enough. No direct competitor? Write down today's workaround (Excel, a group chat, an accountant).",
    good: "Excel + text messages, TurboTenant, Zillow Rental Manager",
    bad: "None / I don't know",
  },
  {
    field: "USP",
    step: 1,
    what: "Why this product? The Copy and Design experts derive your messaging from it.",
    how: "One sentence with a measurable difference: speed, price, channel or level of automation.",
    good: "3-minute setup; tenants never install an app, everything happens over text.",
    bad: "Better and easier.",
  },
  {
    field: "Monetization",
    step: 1,
    what: "Your revenue model; the pricing and billing tasks are written around it.",
    how: "Pick 1–2. Unsure? 'Subscription + Freemium' is a safe start; for marketplaces, 'Commission %'.",
    good: "Subscription (MRR) + Freemium",
    bad: "Everything selected",
  },
  {
    field: "Tech stack",
    step: 2,
    what: "7 layers: frontend, backend, database, auth, AI, realtime/infra, search.",
    how: "A suggestion for your project type comes pre-filled (or let AI suggest one). Stick to a stack you know; the stack AI coding tools know best is Next.js + Postgres/Supabase. One pick per layer is enough.",
    good: "Next.js 15 • Hono + CF Workers • Supabase • Supabase Auth • Claude • Resend",
    bad: "3 picks in every layer (the tool can't decide which to use)",
  },
  {
    field: "Features",
    step: 3,
    what: "Each feature becomes a 'Spec + API + UI + Tests' line in the prompt; step 5 of the Mega Chain builds them in order.",
    how: "5–12 features for v1. Auth + your core flow + billing is enough; save heavyweights like 'Realtime' and 'AI Copilot' for v2.",
    good: "Email/Pass + Magic Link, Dashboard, Advanced CRUD, Notifications Center, Billing & Subscriptions",
    bad: "All 30 features",
  },
  {
    field: "Payment provider & compliance",
    step: 3,
    what: "Your payment flow and compliance constraints (KVKK/GDPR, 3D Secure, PCI DSS…) go into the prompt.",
    how: "Selling globally? Stripe, or Lemon Squeezy as merchant of record (no sales tax or VAT headaches). Selling in Turkey? Iyzico/PayTR + 3D Secure. Always select KVKK/GDPR.",
    good: "Stripe + PayPal • KVKK/GDPR • 3D Secure",
    bad: "All 8 providers",
  },
  {
    field: "Experts",
    step: 4,
    what: "Each expert writes their own task block, constraints and success criteria.",
    how: "3–5 experts is the sweet spot (3 on Free, all 12 on Pro). Core: CTO + PM + Design. Then add by product type: AI Engineer for an AI product, Security for fintech, Monetization for a marketplace, SEO/AEO for a content product.",
    good: "CTO, PM, Design, Security, Monetization (for fintech)",
    bad: "CTO only (PRD and design decisions end up missing)",
  },
  {
    field: "Format & language",
    step: 4,
    what: "Which tool the output is going to.",
    how: "Claude Code / Claude → Claude XML. ChatGPT / Gemini → ChatGPT Markdown. Cursor → Cursor Rules (.cursorrules). v0 → v0. Lovable and Bolt → Lovable/Bolt. If the tool's interface is in English, set the output language to EN; code comments will be written in that language too.",
    good: "I use Claude Code → Claude XML + EN",
    bad: "Pasting Claude XML into v0",
  },
];

export const TOOL_GUIDE_EN: { tool: string; format: string; how: string[] }[] = [
  {
    tool: "Claude Code",
    format: "Claude XML (+ download CLAUDE.md)",
    how: [
      "Put CLAUDE.md in the root of your repo.",
      "Feed the Mega Chain one step at a time, not all at once: 'Step 1: PRD' … 'Step 8: Launch'.",
      "Approve each step's output before moving on to the next, and have it fix mistakes in the same session.",
    ],
  },
  {
    tool: "Cursor / Windsurf",
    format: "Cursor Rules (download .cursorrules)",
    how: [
      "Put .cursorrules in the project root, then kick off in Composer with 'Step 3: DB Schema & API Contract'.",
      "Use the expert blocks in separate chats: CTO (architecture) first, then PM (PRD), then Design.",
    ],
  },
  {
    tool: "v0 / Lovable / Bolt",
    format: "v0 or Lovable/Bolt",
    how: [
      "Paste it into the single prompt box. In round one, give only the Design + PM blocks; add the architecture in round two.",
      "Iterate screen by screen: 'Rewrite the Dashboard screen using the design system from Step 2.'",
    ],
  },
  {
    tool: "ChatGPT / Gemini",
    format: "ChatGPT Markdown",
    how: [
      "Start a new chat, paste the prompt and say: 'Write the PRD first; move on to the schema once I approve it.'",
      "For code generation, turn on ChatGPT's Canvas or Gemini's Code mode.",
    ],
  },
];

/** English names for project types whose display name in data.ts is Turkish (all others are already English). */
const TYPE_NAMES_EN: Record<string, string> = {
  headless: "Headless E-Commerce",
};

/**
 * Same keys and values as AGENT_GUIDE. URLs, formats, expert roles/specs and Mega Chain step names are already English
 * in data.ts, so only the project type names are overridden. Links stay on the shared routes; wrap them with lhref()
 * so they switch to /en once those pages exist.
 */
export const AGENT_GUIDE_EN: typeof AGENT_GUIDE = {
  quickStart: AGENT_GUIDE.quickStart,
  typeIds: AGENT_GUIDE.typeIds.map((t) => ({ ...t, name: TYPE_NAMES_EN[t.id] ?? t.name })),
  shareApi: AGENT_GUIDE.shareApi,
  formats: AGENT_GUIDE.formats,
  experts: AGENT_GUIDE.experts,
  chain: AGENT_GUIDE.chain,
};

/** Every language-specific string on the /docs page. */
export interface DocsUi {
  /** <title>, H1, Open Graph title and JSON-LD HowTo name. */
  title: string;
  /** Meta description, Open Graph description and JSON-LD HowTo description. */
  description: string;
  /** Open Graph locale. */
  ogLocale: string;
  /** Pill above the H1. */
  badge: string;
  /** Intro paragraph, rendered as {introBeforeLink}{" "}<a href="/llms.txt">/llms.txt</a>{" "}{introAfterLink}. */
  introBeforeLink: string;
  introAfterLink: string;
  /** Callout, rendered as <strong>{goldenRuleLabel}</strong> {goldenRule}. */
  goldenRuleLabel: string;
  goldenRule: string;
  /** Section heading for each Studio step. */
  stepNames: Record<FieldGuide["step"], string>;
  /** Labels of the good / weak example boxes on each field card. */
  good: string;
  bad: string;
  /** "Output → tool" section. */
  toolsTitle: string;
  toolsIntro: string;
  /** Mega Chain section. */
  chainTitle: string;
  chainIntro: string;
  /** AI agents section. */
  agentsTitle: string;
  agentsIntro: string;
  /** Comment lines above each URL in the agents code block (include the leading "#"). */
  quickStartComment: string;
  shareApiComment: string;
  llmsTxtComment: string;
  /** <summary> of the project type list; the page appends " ({count})". */
  typeIdsSummary: string;
  /** Link text next to each project type id. */
  typePageLink: string;
  /** Closing call to action. */
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  ctaSecondary: string;
}

export const DOCS_UI_TR: DocsUi = {
  title: "Studio rehberi: iyi bir build prompt için ne yazmalı?",
  description:
    "Prompt.Monster'da her alana ne yazmalı, hangi uzmanları seçmeli, çıktıyı Claude Code / Cursor / v0 / Lovable'a nasıl vermeli — örneklerle. AI ajanları için /llms.txt.",
  ogLocale: "tr_TR",
  badge: "Rehber",
  introBeforeLink:
    "Prompt'un kalitesi girdinin kalitesi kadardır. Aşağıda Studio'daki her alan için ne yazman gerektiğini, iyi ve kötü örnekleri ve çıktıyı hangi araca nasıl vereceğini bulacaksın. Bir AI ajanı kullanıyorsan aynı bilgiyi",
  introAfterLink: "adresinden okuyabilir.",
  goldenRuleLabel: "Altın kural:",
  goldenRule:
    "Somut ol. \"Modern ve hızlı bir platform\" yerine kim için, hangi işi, bugünkü çözümden nasıl farklı yaptığını yaz. Sayı, isim ve sınır ver (\"ilk sürümde X yok\"). Uzmanlar belirsizliği doldurmaz; kararı senden bekler.",
  stepNames: { 1: "1 · Fikir & Vizyon", 2: "2 · Teknoloji", 3: "3 · Özellikler & Ödeme", 4: "4 · Uzmanlar & Üret" },
  good: "İyi",
  bad: "Zayıf",
  toolsTitle: "Çıktıyı araca verme",
  toolsIntro: "Format aracın dilidir; yanlış format çalışır ama daha kötü sonuç verir.",
  chainTitle: "Mega Chain'i adım adım vermek",
  chainIntro:
    "Mega Chain 8 adımdır ve her adım bir öncekinin çıktısını kullanır. Tamamını tek mesajda vermek yerine \"Adım 1\" deyip PRD'yi onayla, sonra \"Adım 2\" de. Böylece araç her adımda senin düzeltmelerini taşır ve context şişmez.",
  agentsTitle: "AI ajanları ve otomasyon",
  agentsIntro:
    "Prompt.Monster'ı bir ajan (Claude Code, Cursor, OpenClaw, n8n…) içinden kullanmak için bugün şu kapılar açık; MCP sunucusu ve Chrome eklentisi yolda.",
  quickStartComment: "# tip ön ayarlarıyla Studio'yu aç",
  shareApiComment: "# paylaşılan bir prompt'u JSON olarak oku",
  llmsTxtComment: "# makine okunur rehber",
  typeIdsSummary: "Proje tipi kimlikleri",
  typePageLink: "sayfa",
  ctaTitle: "Hazırsan Studio seni bekliyor.",
  ctaText: "Bu rehberdeki örnek cümleleri şablon olarak kullan; 10 dakikada ilk master prompt'un hazır.",
  ctaButton: "Studio'yu aç",
  ctaSecondary: "Proje tipine göre başla",
};

export const DOCS_UI_EN: DocsUi = {
  title: "Studio guide: what to write for a great build prompt",
  description:
    "What to write in each Prompt.Monster field, which experts to pick, and how to hand the output to Claude Code, Cursor, v0 or Lovable — with examples. For AI agents: /llms.txt.",
  ogLocale: "en_US",
  badge: "Guide",
  introBeforeLink:
    "A prompt is only as good as its input. Below you'll find what to write in every Studio field, good and weak examples, and how to hand the output to each tool. Using an AI agent? Point it to",
  introAfterLink: "for the same guide in machine-readable form.",
  goldenRuleLabel: "Golden rule:",
  goldenRule:
    "Be specific. Instead of \"a modern, fast platform\", say who it's for, what job it does and how it differs from what people use today. Give numbers, names and limits (\"no X in v1\"). The experts won't fill in the gaps; they expect you to make the call.",
  stepNames: { 1: "1 · Idea & Vision", 2: "2 · Tech Stack", 3: "3 · Features & Payments", 4: "4 · Experts & Generate" },
  good: "Good",
  bad: "Weak",
  toolsTitle: "Handing the output to your tool",
  toolsIntro: "The format is the tool's native language. The wrong one still works, it just gives worse results.",
  chainTitle: "Running the Mega Chain step by step",
  chainIntro:
    "The Mega Chain has 8 steps, and each one builds on the previous step's output. Instead of sending it all in one message, say \"Step 1\" and approve the PRD, then say \"Step 2\". That way the tool carries your corrections into every step and the context doesn't bloat.",
  agentsTitle: "AI agents & automation",
  agentsIntro:
    "Want to use Prompt.Monster from inside an agent (Claude Code, Cursor, OpenClaw, n8n…)? These entry points work today; an MCP server and a Chrome extension are on the way.",
  quickStartComment: "# open the Studio with a project type's presets",
  shareApiComment: "# read a shared prompt as JSON",
  llmsTxtComment: "# machine-readable guide",
  typeIdsSummary: "Project type IDs",
  typePageLink: "page",
  ctaTitle: "Ready? The Studio is waiting.",
  ctaText: "Use the example sentences in this guide as templates, and your first master prompt will be ready in 10 minutes.",
  ctaButton: "Open the Studio",
  ctaSecondary: "Start from a project type",
};
