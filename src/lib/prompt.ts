import { ALL_PROJECT_TYPES, EXPERTS, MEGA_CHAIN_STEPS, PAYMENTS } from "./data";
import type { Expert, OutputFormat, StudioState } from "./types";

/* ------------------------------------------------------------------ */
/*  Section labels (TR / EN)                                           */
/* ------------------------------------------------------------------ */

/** "a" / "an" before an English role ("an AI Engineer", "an SEO/AEO Strategist", "a QA Automation"). */
function article(role: string): "a" | "an" {
  const w = role.trim().split(/[\s/&]+/)[0] ?? "";
  if (w.length > 1 && w === w.toUpperCase()) return /^[AEFHILMNORSX]/.test(w) ? "an" : "a";
  return /^[aeiou]/i.test(w) ? "an" : "a";
}

const L = {
  TR: {
    role: "ROL",
    context: "BAĞLAM",
    task: "GÖREV",
    arch: "TEKNİK MİMARİ",
    features: "ÖZELLİK MATRİSİ",
    constraints: "KISITLAR",
    output: "ÇIKTI FORMATI",
    success: "BAŞARI KRİTERLERİ",
    never: "ASLA YAPMA (RED)",
    check: "KENDİNİ DOĞRULA",
    project: "Proje",
    type: "Tip",
    vision: "Vizyon",
    target: "Hedef",
    pain: "Acı",
    budget: "Bütçe",
    competitors: "Rakipler",
    usp: "USP",
    monetization: "Monetizasyon",
    payment: "Ödeme",
    stack: "Tech Stack",
    features_: "Özellikler",
    compliance: "Compliance",
    lang: "Dil",
    intro: (e: Expert) =>
      `Sen ${e.years} yıllık bir ${e.role}'sun. Uzmanlığın: ${e.spec}. Stripe, Linear, Vercel seviyesinde dünya klası ürünler ship ettin.`,
    general: "Genel: Üretim kalitesinde, kopyala-yapıştır çalışacak detayda.",
    payflow: "Ödeme Akışı",
    featureLine: (f: string) => `- [ ] ${f} -> Spec + API + UI + Test`,
    constraints_: ["100ms etkileşim, 99.9% uptime, GDPR/KVKK by design", "ASLA yapma: Over-engineering, premature abstraction, client-side secret, N+1 query"],
    output_: ["Kod: TypeScript, tip güvenli ORM şeması, API route'ları, shadcn components", "Doküman: Markdown tablolar + Mermaid diyagram", "Örnek: 1 tam feature end-to-end (örn: billing)"],
    success_: "p95 < 100ms, Lighthouse 95+, 0 critical vuln, MRR ilk 30 gün $1k",
    never_: 'Lorem ipsum, placeholder, "TODO" bırakma. Her satır production-ready.',
    check_: [
      "Yanıtı bitirmeden önce kendi işini doğrula:",
      "- GÖREV'deki her maddeyi karşıladın mı? Eksik kalanı tamamla.",
      "- Çıktı ÇIKTI FORMATI'na birebir uyuyor mu?",
      "- BAĞLAM'la tutarlı mı (stack, özellikler, ödeme, uyumluluk)?",
      "- Yer tutucu, TODO ya da uydurma bilgi yok; varsayımlarını sonda listele.",
      "- Kod yazdıysan çalıştır: testler, tip kontrolü ve lint temiz olmalı. Arayüz varsa Playwright ile ekran görüntüsü al, yanlış görüneni düzelt; Lighthouse ≥ 90.",
    ],
    finalCheck: [
      "Her Mega Chain adımından sonra ve en sonda kendi çıktını test et ve düzelt:",
      "1. Uygulamayı çalıştır; birim ve uçtan uca (Playwright) testleri koş, hepsi geçene kadar düzelt.",
      "2. Kritik ekranların Playwright ekran görüntülerini al; tasarım sistemine ve boş / hata / yükleniyor durumlarına göre kontrol et.",
      "3. Lighthouse (performans, erişilebilirlik, SEO) ≥ 90; altındaysa nedenini bul ve düzelt.",
      "4. Güvenlik turu: gizli anahtar sızıntısı yok, yetki sunucuda kontrol ediliyor, her girdi doğrulanıyor.",
      "5. Her özelliğin kabul kriterlerini tek tek işaretle; eksik varken 'bitti' deme.",
      "6. Sonunda kısa bir rapor ver: ne yapıldı, test sonuçları, ekran görüntüleri, bilinen riskler, sonraki adımlar.",
    ],
  },
  EN: {
    role: "ROLE",
    context: "CONTEXT",
    task: "TASK",
    arch: "TECHNICAL ARCHITECTURE",
    features: "FEATURE MATRIX",
    constraints: "CONSTRAINTS",
    output: "OUTPUT FORMAT",
    success: "SUCCESS CRITERIA",
    never: "NEVER DO (RED LINES)",
    check: "SELF-CHECK",
    project: "Project",
    type: "Type",
    vision: "Vision",
    target: "Target user",
    pain: "Pain",
    budget: "Budget",
    competitors: "Competitors",
    usp: "USP",
    monetization: "Monetization",
    payment: "Payments",
    stack: "Tech Stack",
    features_: "Features",
    compliance: "Compliance",
    lang: "Lang",
    intro: (e: Expert) =>
      `You are ${article(e.role)} ${e.role} with ${e.years} years of experience. Specialty: ${e.spec}. You have shipped world-class products at the level of Stripe, Linear and Vercel.`,
    general: "General: production quality, copy-paste ready level of detail.",
    payflow: "Payment flow",
    featureLine: (f: string) => `- [ ] ${f} -> Spec + API + UI + Tests`,
    constraints_: ["100ms interactions, 99.9% uptime, GDPR/KVKK by design", "NEVER: over-engineering, premature abstraction, client-side secrets, N+1 queries"],
    output_: ["Code: TypeScript, type-safe ORM schema, API routes, shadcn components", "Docs: Markdown tables + Mermaid diagrams", "Example: 1 full feature end-to-end (e.g. billing)"],
    success_: "p95 < 100ms, Lighthouse 95+, 0 critical vulns, $1k MRR in the first 30 days",
    never_: 'No lorem ipsum, placeholders or "TODO". Every line production-ready.',
    check_: [
      "Before you finish, verify your own work:",
      "- Did you cover every item in TASK? Complete anything missing.",
      "- Does the output match OUTPUT FORMAT exactly?",
      "- Is it consistent with CONTEXT (stack, features, payments, compliance)?",
      "- No placeholders, TODOs or invented facts; list your assumptions at the end.",
      "- If you wrote code, run it: tests, type check and lint must pass. For UI, take Playwright screenshots and fix what looks wrong; Lighthouse ≥ 90.",
    ],
    finalCheck: [
      "After every Mega Chain step, and once more at the end, test your own output and fix it:",
      "1. Run the app; run the unit and end-to-end (Playwright) tests and fix until they all pass.",
      "2. Take Playwright screenshots of the critical screens; check them against the design system and the empty / error / loading states.",
      "3. Lighthouse (performance, accessibility, SEO) ≥ 90; if lower, find the cause and fix it.",
      "4. Security pass: no leaked secrets, authorization checked on the server, every input validated.",
      "5. Tick off each feature's acceptance criteria one by one; don't call it done while anything is missing.",
      "6. Finish with a short report: what was built, test results, screenshots, known risks, next steps.",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function projectTypeName(id: string): string {
  return ALL_PROJECT_TYPES.find((p) => p.id === id)?.name ?? id;
}

export function paymentNames(ids: string[]): string {
  return ids.map((id) => PAYMENTS.find((p) => p.id === id)?.name ?? id).join(", ");
}

export function stackList(s: StudioState): string[] {
  return [...s.frontend, ...s.backend, ...s.database, ...s.auth, ...s.ai, ...s.realtime, ...s.search];
}

/** Quality score 50–98, same heuristic as the original Studio. */
export function qualityScore(s: StudioState): number {
  let p = 50;
  if (s.name.length > 2) p += 5;
  if (s.pitch.length > 10) p += 10;
  if (s.description.length > 50) p += 10;
  if (s.features.length > 5) p += 10;
  if (s.experts.length >= 3) p += 10;
  if (s.frontend.length && s.backend.length && s.database.length) p += 5;
  return Math.min(98, p);
}

/** Rough token estimate shown in the UI. */
export function estimateTokens(s: StudioState): number {
  return 2400 + s.features.length * 180 + s.experts.length * 650;
}

type Section = { key: "role" | "context" | "task" | "arch" | "features" | "constraints" | "output" | "success" | "never" | "check"; tag: string; body: string };

/** Keys of the prompt sections that carry a heading in L. */
export type PromptSection = "role" | "context" | "task" | "arch" | "features" | "constraints" | "output" | "success" | "never" | "check";

/** A section's Markdown heading in both output languages, TR first (the Studio splits generated prompts with these). */
export function sectionHeadings(key: PromptSection): [string, string] {
  return [L.TR[key], L.EN[key]];
}

function wrap(format: OutputFormat, sec: Section, lang: "TR" | "EN", attrs = ""): string {
  const title = L[lang][sec.key] as string;
  if (format === "Claude XML") {
    return `<${sec.tag}${attrs}>\n${sec.body}\n</${sec.tag}>`;
  }
  return `### ${title}\n${sec.body}`;
}

/* ------------------------------------------------------------------ */
/*  Single-expert prompt                                               */
/* ------------------------------------------------------------------ */

export function buildExpertPrompt(s: StudioState, expertId: string, opts: { selfCheck?: boolean } = {}): string {
  const e = EXPERTS.find((x) => x.id === expertId);
  if (!e) return "";
  const t = L[s.lang];
  const f = s.format;
  const stack = stackList(s).join(", ");
  const pay = paymentNames(s.payments);
  const comp = s.competitors.filter(Boolean).join(" vs ");

  const role: Section = {
    key: "role",
    tag: "role",
    body: t.intro(e),
  };
  const roleAttrs = ` name="${e.role}" org="${e.org}" specialty="${e.spec}" experience="${e.years}y"`;
  const roleHeader = f === "Claude XML" ? "" : `## ${t.role}: ${e.role} [${e.org}]\n`;

  const context: Section = {
    key: "context",
    tag: "context",
    body: [
      `${t.project}: ${s.name} - ${s.pitch}`,
      `${t.type}: ${projectTypeName(s.projectType)}`,
      `${t.vision}: ${s.description}`,
      `${t.target}: ${s.audience.role} - ${t.pain}: ${s.audience.pain} - ${t.budget}: ${s.audience.budget}`,
      `${t.competitors}: ${comp}`,
      `${t.usp}: ${s.usp}`,
      `${t.monetization}: ${s.monetization.join(", ")} | ${t.payment}: ${pay}`,
      `${t.stack}: ${stack}`,
      `${t.features_}: ${s.features.join(", ")}`,
      `${t.compliance}: ${s.compliance.join(", ")}`,
      `${t.lang}: ${s.lang}`,
    ].join("\n"),
  };

  const task: Section = { key: "task", tag: "task", body: `${s.lang === "EN" ? (e.taskEn ?? e.task) : e.task}\n${t.general}` };

  const arch: Section = {
    key: "arch",
    tag: "technical_architecture",
    body: [
      `- Frontend: ${s.frontend.join(" | ")} - App Router, Server Components, partial prerendering`,
      `- Backend: ${s.backend.join(" | ")} - Edge runtime, RPC, zod validation`,
      `- DB: ${s.database.join(" | ")} - pgvector for semantic search, type-safe ORM, RLS policies`,
      `- Auth: ${s.auth.join(" | ")} - Passkeys first, org/team model`,
      `- Search: ${s.search.join(" | ")} - typo-tolerant, faceted`,
      `- Realtime: ${s.realtime.join(" | ")} - presence, CRDT-ready`,
      `${t.payflow}: ${pay} -> Webhook -> Background job -> Entitlement update -> Audit log`,
    ].join("\n"),
  };

  const features: Section = {
    key: "features",
    tag: "feature_matrix",
    body: s.features.map(t.featureLine).join("\n"),
  };

  const constraints: Section = { key: "constraints", tag: "constraints", body: t.constraints_.map((c) => `- ${c}`).join("\n") };
  const output: Section = { key: "output", tag: "output_format", body: t.output_.join("\n") };
  const success: Section = { key: "success", tag: "success_criteria", body: `- ${t.success_}` };
  const never: Section = { key: "never", tag: "never_do", body: `- ${t.never_}` };
  const check: Section = { key: "check", tag: "self_check", body: t.check_.join("\n") };

  const parts = [
    roleHeader + wrap(f, role, s.lang, roleAttrs),
    wrap(f, context, s.lang),
    wrap(f, task, s.lang),
    wrap(f, arch, s.lang),
    wrap(f, features, s.lang),
    wrap(f, constraints, s.lang),
    wrap(f, output, s.lang),
    wrap(f, success, s.lang),
    wrap(f, never, s.lang),
    ...(opts.selfCheck === false ? [] : [wrap(f, check, s.lang)]),
  ];

  let body = parts.join("\n\n");
  if (f === "Claude XML") body = `<prompt>\n${body}\n</prompt>`;
  return applyFormatPreamble(f, s, body).trim();
}

/** Tool-specific framing for the non-XML formats. */
function applyFormatPreamble(f: OutputFormat, s: StudioState, body: string): string {
  switch (f) {
    case "Cursor Rules":
      return `# .cursorrules — ${s.name}\n# Generated by Prompt.Monster. Place this file at the repo root.\n\nYou are the senior engineer on ${s.name}. Follow every rule below on every edit.\n\n${body}`;
    case "v0":
      return `Build the UI for ${s.name} (${s.pitch}). Use Next.js App Router, Tailwind and shadcn/ui, dark theme. Return complete, runnable components.\n\n${body}`;
    case "Lovable/Bolt":
      return `Create a full-stack web app called ${s.name}: ${s.pitch}. Scaffold the whole project, wire the database and auth, then implement the feature matrix in order.\n\n${body}`;
    default:
      return body;
  }
}

/* ------------------------------------------------------------------ */
/*  Mega chain                                                         */
/* ------------------------------------------------------------------ */

export function buildMegaHeader(s: StudioState): string {
  const tr = s.lang === "TR";
  return [
    `# ${s.name} - MASTER BUILD PROMPT`,
    ``,
    `Stack: ${[...s.frontend, ...s.backend].join(", ")}`,
    ``,
    `${tr ? "Hedef" : "Goal"}: ${s.pitch}`,
    ``,
    tr
      ? `Bu prompt ${MEGA_CHAIN_STEPS.length} adımda full-stack ${projectTypeName(s.projectType)} üretir. Her adım bir öncekinin çıktısını kullanır. ${s.experts.length} uzmanın bilgisi harmanlandı.`
      : `This prompt builds a full-stack ${projectTypeName(s.projectType)} in ${MEGA_CHAIN_STEPS.length} steps. Each step consumes the previous step's output. ${s.experts.length} experts' knowledge combined.`,
    ``,
    `${tr ? "Adımlar" : "Steps"}:`,
    ...MEGA_CHAIN_STEPS.map((st, i) => `${i + 1}. ${st}`),
  ].join("\n");
}

/** Full mega prompt = header + every selected expert prompt, separated. */
export function buildMegaPrompt(s: StudioState): string {
  const known = s.experts.filter((id) => EXPERTS.some((e) => e.id === id));
  const experts = known.length ? known : EXPERTS.slice(0, 3).map((e) => e.id);
  return [buildMegaHeader(s), ...experts.map((id) => buildExpertPrompt(s, id, { selfCheck: false })), buildFinalCheck(s)].join("\n\n---\n\n");
}

/** The closing "test your own output and fix it" step of every master prompt. */
export function buildFinalCheck(s: StudioState): string {
  const t = L[s.lang];
  const body = t.finalCheck.join("\n");
  return s.format === "Claude XML" ? `<self_check scope="final">\n${body}\n</self_check>` : `## ${t.check}\n${body}`;
}

/** Short preview used in the Mega Chain panel. */
export function buildMegaPreview(s: StudioState): string {
  return (
    buildMegaHeader(s) +
    "\n\n---\n\n" +
    s.experts
      .map((id) => `${EXPERTS.find((e) => e.id === id)?.role}: ${buildExpertPrompt(s, id).slice(0, 180)}...`)
      .join("\n\n")
  );
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export function exportJSON(s: StudioState): string {
  return JSON.stringify(
    {
      project: {
        name: s.name,
        pitch: s.pitch,
        type: s.projectType,
        typeName: projectTypeName(s.projectType),
        description: s.description,
        audience: s.audience,
        competitors: s.competitors.filter(Boolean),
        usp: s.usp,
        monetization: s.monetization,
      },
      stack: {
        frontend: s.frontend,
        backend: s.backend,
        database: s.database,
        auth: s.auth,
        ai: s.ai,
        realtime: s.realtime,
        search: s.search,
      },
      features: s.features,
      payments: s.payments,
      compliance: s.compliance,
      experts: s.experts,
      output: { lang: s.lang, format: s.format },
      prompts: Object.fromEntries(s.experts.map((id) => [id, buildExpertPrompt(s, id)])),
      megaPrompt: buildMegaPrompt(s),
      generatedBy: "Prompt.Monster",
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function exportCursorRules(s: StudioState): string {
  return buildMegaPrompt({ ...s, format: "Cursor Rules" });
}

export function exportClaudeMd(s: StudioState): string {
  return `# CLAUDE.md — ${s.name}\n\nThis file is read by Claude Code at the start of every session. Keep it at the repo root.\n\n${buildMegaPrompt({ ...s, format: "ChatGPT Markdown" })}`;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "prompt-monster"
  );
}
