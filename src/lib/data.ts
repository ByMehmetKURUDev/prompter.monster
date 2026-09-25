import type {
  Expert,
  FeatureGroup,
  PaymentProvider,
  ProjectCategory,
  StudioState,
} from "./types";

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    cat: "🚀 STARTUP",
    items: [
      { id: "saas-dash", name: "SaaS Dashboard", icon: "📊", badge: "HOT" },
      { id: "ai-wrapper", name: "AI SaaS Wrapper", icon: "🤖", badge: "NEW" },
      { id: "plg", name: "PLG Product", icon: "📈", badge: "HOT" },
      { id: "chrome-ext", name: "Chrome Extension + App", icon: "🧩", badge: "" },
    ],
  },
  {
    cat: "🛒 COMMERCE",
    items: [
      { id: "headless", name: "Headless E-Ticaret", icon: "🛍️", badge: "HOT" },
      { id: "marketplace", name: "Multi-Vendor Marketplace", icon: "🏪", badge: "" },
      { id: "d2c", name: "D2C Subscription Box", icon: "📦", badge: "NEW" },
      { id: "b2b", name: "B2B Wholesale Portal", icon: "🏭", badge: "" },
    ],
  },
  {
    cat: "💸 FINTECH",
    items: [
      { id: "neobank", name: "Neobank Dashboard", icon: "🏦", badge: "NEW" },
      { id: "crypto", name: "Crypto/DeFi Tracker", icon: "₿", badge: "HOT" },
      { id: "invoice", name: "Invoice & Billing SaaS", icon: "🧾", badge: "" },
    ],
  },
  {
    cat: "👥 COMMUNITY",
    items: [
      { id: "social", name: "Social Network", icon: "💬", badge: "" },
      { id: "creator", name: "Creator Economy", icon: "🎬", badge: "NEW" },
      { id: "jobboard", name: "Job Board ATS", icon: "💼", badge: "" },
    ],
  },
  {
    cat: "🏥 VERTICAL",
    items: [
      { id: "edtech", name: "EdTech LMS", icon: "🎓", badge: "" },
      { id: "health", name: "HealthTech Telemedicine", icon: "🩺", badge: "NEW" },
      { id: "proptech", name: "PropTech Real Estate", icon: "🏠", badge: "" },
      { id: "logistics", name: "Logistics Tracking", icon: "🚚", badge: "" },
      { id: "ondemand", name: "On-Demand Uber-like", icon: "🚕", badge: "HOT" },
      { id: "booking", name: "Booking SaaS", icon: "📅", badge: "" },
      { id: "crm", name: "CRM/ERP", icon: "🗂️", badge: "" },
      { id: "nocode", name: "No-Code Builder", icon: "🧱", badge: "NEW" },
    ],
  },
];

export const ALL_PROJECT_TYPES = PROJECT_CATEGORIES.flatMap((c) => c.items);

export const TEMPLATES = [
  "Linear Clone",
  "Notion AI",
  "Shopify Headless",
  "Uber Eats Clone",
  "Cal.com Clone",
  "Product Hunt Clone",
  "Framer Sites Clone",
  "Stripe Dashboard",
  "Superhuman Clone",
  "Loom + Vimeo",
  "Gumroad Clone",
  "Substack Clone",
  "Raycast AI",
  "Retool Clone",
  "Vercel Clone",
];

export const STACK = {
  frontend: ["Next.js 15 (App Router)", "Remix v2", "Astro 4", "SvelteKit 2", "Nuxt 3", "React Native Expo", "Vite + TanStack", "Qwik City"],
  backend: ["NestJS", "Hono + CF Workers", "Elysia (Bun)", "Go Fiber", "Laravel 11", "Django 5 + FastAPI", "Rust Axum", "tRPC + Next"],
  database: ["PostgreSQL + pgvector", "Neon Serverless", "PlanetScale", "Supabase", "Turso Edge", "MongoDB Atlas", "ClickHouse", "Upstash Redis", "Qdrant Vector DB"],
  auth: ["Clerk", "Auth.js v5", "Supabase Auth", "Lucia + Oslo", "Custom JWT", "WorkOS SSO"],
  ai: ["OpenAI GPT-4o", "Claude 3.5 Sonnet", "Groq Llama 3 70B", "Perplexity API", "Replicate SDXL", "Fal.ai Flux", "ElevenLabs", "Pinecone"],
  realtime: ["PartyKit", "Liveblocks", "Pusher", "Cloudflare R2", "UploadThing", "Resend", "Trigger.dev", "Inngest"],
  search: ["Algolia", "Typesense", "Meilisearch"],
} as const;

export type StackKey = keyof typeof STACK;

export const STACK_LABELS: Record<StackKey, string> = {
  frontend: "FRONTEND",
  backend: "BACKEND",
  database: "DATABASE + VECTOR",
  auth: "AUTH",
  ai: "AI STACK",
  realtime: "REALTIME & INFRA",
  search: "SEARCH",
};

/** Default AI suggestion per project type (used when no API key is configured). */
export const STACK_SUGGESTIONS: Record<string, string[]> = {
  "saas-dash": ["Next.js 15 (App Router)", "Hono + CF Workers", "Neon Serverless", "Clerk", "Typesense"],
  "ai-wrapper": ["Next.js 15 (App Router)", "Elysia (Bun)", "Qdrant Vector DB", "Claude 3.5 Sonnet", "Groq Llama 3 70B"],
  headless: ["Next.js 15 (App Router)", "Go Fiber", "PlanetScale", "Algolia"],
  marketplace: ["Next.js 15 (App Router)", "NestJS", "PostgreSQL + pgvector", "Auth.js v5", "Meilisearch"],
  neobank: ["Next.js 15 (App Router)", "Go Fiber", "PostgreSQL + pgvector", "WorkOS SSO"],
  social: ["Next.js 15 (App Router)", "tRPC + Next", "Supabase", "Supabase Auth", "Liveblocks"],
  edtech: ["Next.js 15 (App Router)", "NestJS", "Supabase", "Supabase Auth", "UploadThing"],
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    cat: "Auth & Access",
    items: ["Email/Pass + Magic Link", "Social OAuth (Google/Github)", "2FA & Passkeys", "RBAC + Permissions", "Multi-tenancy", "Team Invite & Roles"],
  },
  {
    cat: "Product Core",
    items: [
      "Dashboard + Command Palette",
      "Advanced CRUD + Bulk Ops",
      "File Upload + CDN",
      "Realtime Presence",
      "Global Search (⌘K)",
      "Notifications Center",
      "Comments & Threads",
      "Ratings & Reviews",
      "Chat + Video Call",
      "Calendar & Scheduling",
      "Kanban / Board View",
      "Analytics Charts",
    ],
  },
  {
    cat: "Growth & Monetization",
    items: [
      "Billing & Subscriptions",
      "API Keys & Rate Limit",
      "Webhooks & Events",
      "Audit Logs",
      "Admin Panel + Impersonate",
      "Affiliate System",
      "Referral + Credits",
      "In-app Onboarding Tour",
      "AI Assistant Copilot",
    ],
  },
];

export const PAYMENTS: PaymentProvider[] = [
  { id: "stripe", name: "Stripe", fee: "2.9% + 30¢", best: "Global SaaS", tr: false, color: "#635BFF" },
  { id: "lemonsqueezy", name: "LemonSqueezy", fee: "5% + 50¢", best: "MoR, No Tax Headache", tr: false, color: "#FFC233" },
  { id: "paddle", name: "Paddle", fee: "5% + 50¢", best: "B2B SaaS", tr: false, color: "#FDD706" },
  { id: "paypal", name: "PayPal", fee: "3.49% + 49¢", best: "Legacy Trust", tr: true, color: "#003087" },
  { id: "iyzico", name: "Iyzico", fee: "2.59% + 0.25₺", best: "TR Market Leader", tr: true, color: "#1A73E8" },
  { id: "paytr", name: "PayTR", fee: "2.39% + 0.25₺", best: "TR Low Fee", tr: true, color: "#00C950" },
  { id: "mercado", name: "MercadoPago", fee: "4.99% + fixed", best: "LATAM", tr: false, color: "#00B1EA" },
  { id: "coinbase", name: "Coinbase Commerce", fee: "1% fee", best: "Crypto / Web3", tr: false, color: "#0052FF" },
];

export const COMPLIANCE = ["KVKK/GDPR", "SOC2", "3D Secure", "E-Fatura", "PCI DSS"];

export const MONETIZATION = ["Freemium", "Subscription (MRR)", "Usage-Based", "Commission %", "One-time + Lifetime", "Hybrid / Credits"];

export const EXPERTS: Expert[] = [
  {
    id: "cto",
    emoji: "👨‍💻",
    role: "Staff Engineer / CTO",
    org: "ex-Stripe, ex-Vercel",
    spec: "System Architecture",
    years: 12,
    color: "#A3FF12",
    task: "Sistem mimarisini tasarla. Edge-first, 100ms p95. DB schema, API contract, caching stratejisi, multi-tenancy, RLS, idempotency. Seçilen backend + DB kombinasyonunun neden doğru olduğunu ve scaling planını yaz.",
  },
  {
    id: "pm",
    emoji: "📦",
    role: "Product Manager",
    org: "ex-Linear",
    spec: "PRD & Roadmap",
    years: 8,
    color: "#8B5CF6",
    task: "Kusursuz PRD yaz. User stories (Jobs-to-be-Done), acceptance criteria, edge cases, metrics (North Star, activation, retention), roadmap'i RICE ile önceliklendir. 7 gün içinde MVP scope.",
  },
  {
    id: "design",
    emoji: "🎨",
    role: "Design Director",
    org: "Awwwards Jury",
    spec: "Design System",
    years: 10,
    color: "#FF6B6B",
    task: "Design system oluştur: Tailwind tokens, shadcn/ui, dark mode only, Linear benzeri density, command palette, keyboard-first. 3 kritik flow için wireframe tarif et.",
  },
  {
    id: "growth",
    emoji: "📈",
    role: "Growth Architect",
    org: "PLG $10M ARR",
    spec: "$10M Playbook",
    years: 9,
    color: "#A3FF12",
    task: "PLG büyüme planı: aktivasyon funnel'ı, aha-moment tanımı, viral loop / referral mekaniği, onboarding checklist, ilk 90 gün için haftalık deney listesi (hipotez, metrik, başarı eşiği).",
  },
  {
    id: "seo",
    emoji: "🔍",
    role: "SEO/AEO Strategist",
    org: "AI Search Pioneer",
    spec: "Perplexity Ranking",
    years: 7,
    color: "#38BDF8",
    task: "AEO + SEO: Programmatic SEO sayfaları, schema.org, Perplexity / ChatGPT Search için optimize, internal linking, waitlist -> launch playbook.",
  },
  {
    id: "devops",
    emoji: "🚀",
    role: "DevOps / SRE",
    org: "ex-Vercel Infra",
    spec: "Scale & Security",
    years: 11,
    color: "#FB923C",
    task: "Deploy ve operasyon planı: CI/CD pipeline (preview + production), IaC, secrets yönetimi, observability (logs, traces, alerts), SLO/SLA tanımı, incident runbook, maliyet tahmini ve ölçekleme eşikleri.",
  },
  {
    id: "security",
    emoji: "🔒",
    role: "Security & Compliance",
    org: "SOC2 Auditor",
    spec: "KVKK/GDPR",
    years: 10,
    color: "#F472B6",
    task: "Threat model (STRIDE), OWASP Top 10 kontrol listesi, auth/session sertleştirme, veri sınıflandırma, KVKK/GDPR uyum haritası (veri envanteri, saklama süreleri, silme akışı), audit log şeması.",
  },
  {
    id: "copy",
    emoji: "✍️",
    role: "Conversion Copywriter",
    org: "YC Top Writer",
    spec: "Landing & UX",
    years: 8,
    color: "#A3FF12",
    task: "Landing page copy: hero (başlık + alt başlık + CTA), 3 fayda bloğu, sosyal kanıt, itiraz karşılama, pricing sayfası metinleri, onboarding e-posta serisi (5 e-posta), UX microcopy (boş durumlar, hatalar).",
  },
  {
    id: "data",
    emoji: "📊",
    role: "Data Engineer",
    org: "ex-Mixpanel",
    spec: "Analytics & Events",
    years: 9,
    color: "#22D3EE",
    task: "Event tracking planı: North Star ve destekleyici metrikler, event/property sözlüğü, funnel ve retention tanımları, veri ambarı şeması, dashboard listesi, veri kalitesi testleri.",
  },
  {
    id: "ai",
    emoji: "🤖",
    role: "AI Engineer",
    org: "OpenAI Alumni",
    spec: "LLM & RAG",
    years: 6,
    color: "#8B5CF6",
    task: "LLM mimarisi: ana model + fallback model, RAG (chunking, embedding, vektör DB), prompt chaining, evals. Context window yönetimi, tool calling, streaming UX, maliyet/gecikme bütçesi.",
  },
  {
    id: "qa",
    emoji: "🧪",
    role: "QA Automation",
    org: "ex-Chromatic",
    spec: "Testing Strategy",
    years: 8,
    color: "#4ADE80",
    task: "Test stratejisi: test piramidi (unit/integration/e2e), Playwright e2e senaryoları kritik akışlar için, visual regression, contract testleri, CI'da kalite kapıları, flaky test politikası.",
  },
  {
    id: "monet",
    emoji: "💰",
    role: "Monetization Strategist",
    org: "ex-Paddle",
    spec: "Pricing & Packaging",
    years: 9,
    color: "#FACC15",
    task: "Pricing: Freemium vs Free Trial, 3 tier ($19/$49/$149), annual %20 indirim, credit system. Seçilen ödeme sağlayıcılarıyla hybrid akış. Churn reduction taktikleri.",
  },
];

export const FORMATS = ["ChatGPT Markdown", "Claude XML", "Cursor Rules", "v0", "Lovable/Bolt"] as const;

export const MEGA_CHAIN_STEPS = [
  "PRD & User Stories",
  "Design System (Figma tokens)",
  "DB Schema & API Contract",
  "Auth & Billing Implementation",
  "Core Features Build",
  "AI Integration (RAG + Agents)",
  "SEO/AEO & Analytics",
  "Launch & Growth Checklist",
];

export const EXPORT_TARGETS = [
  { id: "md", name: "Markdown (.md)", desc: "Notion / GitHub için", icon: "📝", ext: "md" },
  { id: "json", name: "JSON (structured)", desc: "API & Automation", icon: "🧩", ext: "json" },
  { id: "cursorrules", name: ".cursorrules", desc: "Cursor IDE kuralları", icon: "⚡", ext: "cursorrules" },
  { id: "claude", name: "CLAUDE.md", desc: "Claude Code için", icon: "🤖", ext: "md" },
  { id: "txt", name: "Plain text (.txt)", desc: "Her araca yapıştır", icon: "📄", ext: "txt" },
] as const;

export const BUILDERS = ["Cursor", "Windsurf", "v0", "Lovable", "Bolt", "Replit"];

/** The demo project the Studio opens with (same as the original artifact). */
export const DEFAULT_STATE: StudioState = {
  step: 1,
  projectType: "saas-dash",
  name: "NeuroFlow",
  pitch: "AI-powered work OS that kills context switching for startup teams",
  description:
    "Küçük ekipler için Linear hızında, Notion esnekliğinde, Superhuman odaklı bir iş işletim sistemi. Görevler, dokümanlar, toplantılar ve AI ajanları tek yerde. 10x daha hızlı shipping, %0 context switching.",
  audience: { role: "Seed CTO", pain: "Tool sprawl, 7 app arasında kaybolma", budget: "$29-99/mo" },
  competitors: ["Linear + Notion + Slack", "Motion", "Sunsama"],
  usp: "Tek keyboard shortcut ile her şey: task -> doc -> meeting notes -> AI action. 100ms altında her etkileşim, offline-first.",
  monetization: ["Subscription (MRR)", "Freemium"],
  frontend: ["Next.js 15 (App Router)"],
  backend: ["Hono + CF Workers"],
  database: ["Neon Serverless", "Upstash Redis", "Qdrant Vector DB"],
  auth: ["Clerk"],
  ai: ["Claude 3.5 Sonnet", "Groq Llama 3 70B"],
  realtime: ["Liveblocks", "UploadThing", "Resend"],
  search: ["Typesense"],
  features: [
    "Email/Pass + Magic Link",
    "Social OAuth (Google/Github)",
    "Dashboard + Command Palette",
    "Advanced CRUD + Bulk Ops",
    "Global Search (⌘K)",
    "Billing & Subscriptions",
    "API Keys & Rate Limit",
    "AI Assistant Copilot",
    "Realtime Presence",
  ],
  payments: ["stripe", "iyzico"],
  compliance: ["KVKK/GDPR", "3D Secure"],
  experts: ["cto", "pm", "design", "ai", "monet"],
  lang: "TR",
  format: "Claude XML",
};

/** A blank project for "Yeni Canavar Yarat". */
export const EMPTY_STATE: StudioState = {
  ...DEFAULT_STATE,
  name: "",
  pitch: "",
  description: "",
  audience: { role: "", pain: "", budget: "" },
  competitors: ["", "", ""],
  usp: "",
  monetization: [],
  features: [],
  experts: [],
};
