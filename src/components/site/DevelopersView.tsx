import { ArrowRight, Braces, FileCode2, KeyRound, Plug, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { PROJECT_FILES } from "@/lib/exports";
import { lhref, type Locale } from "@/lib/i18n";
import { API_BASE, MCP_URL, OPENAPI_URL } from "@/lib/mcp-setup";
import { readPublicSettings } from "@/lib/settings-server";
import { PublicShell } from "./PublicShell";
import { SetupSnippets } from "./SetupSnippets";

export const DEV_META = {
  tr: {
    title: "API ve MCP sunucusu — Prompt.Monster'ı editörünün içinden kullan",
    description:
      "Prompt.Monster MCP sunucusu ve REST API: Claude Code, Cursor, VS Code, Windsurf, Claude Desktop ve ChatGPT'den fikrinden master build prompt'u ve AGENTS.md / CLAUDE.md gibi proje dosyalarını üret.",
  },
  en: {
    title: "API & MCP server — use Prompt.Monster from inside your editor",
    description:
      "The Prompt.Monster MCP server and REST API: generate master build prompts and project files like AGENTS.md and CLAUDE.md from Claude Code, Cursor, VS Code, Windsurf, Claude Desktop and ChatGPT.",
  },
} as const;

const T = {
  tr: {
    badge: "MCP · REST API · OpenAPI",
    h1: "Prompt.Monster'ı editörünün içinden kullan",
    lead: "MCP sunucusu ve REST API ile fikrini Claude Code, Cursor, VS Code, Windsurf, Claude Desktop veya ChatGPT'den çıkmadan master build prompt'una ve ajan dosyalarına dönüştür. Prompt üretimi ücretsiz; anahtarsız da çalışır.",
    getKey: "API anahtarı al",
    quick: "3 adımda başla",
    steps: [
      ["Anahtar al (isteğe bağlı)", "Hesabından bir API anahtarı oluştur. Anahtarsız kullanım Free sınırlarıyla çalışır; AI iyileştirme ve dosya export'u anahtar ister."],
      ["MCP sunucusunu ekle", "Aşağıdaki kurulumdan aracını seç, tek komut veya küçük bir JSON."],
      ["Sadece iste", "“prompt-monster ile serbest çalışanlar için AI fatura uygulamasının build prompt'unu hazırla” de — ya da Claude Code'da /mcp__prompt-monster__new_project."],
    ],
    setup: "Kurulum",
    endpoint: "MCP adresi",
    tools: "MCP araçları",
    tool: "Araç",
    does: "Ne yapar",
    needs: "Gerekir",
    free: "Ücretsiz",
    keyPro: "Anahtar + Pro",
    keyCredits: (n: number) => `Anahtar · ${n} kredi`,
    toolRows: {
      list_project_types: "Proje tiplerini (id, ad, kategori, açıklama) listeler.",
      get_type_preset: "Bir tipin hazır ayarı: uzmanlar, stack, v1 özellikleri, ödeme, gelir modeli.",
      list_experts: "18 uzman personayı listeler.",
      generate_build_prompt: "Fikirden master build prompt'u (veya uzman başına prompt) üretir. Deterministik, kredi harcamaz.",
      export_files: "AGENTS.md, CLAUDE.md, .claude/agents, Cursor kuralları, Copilot talimatları, Task Master PRD'si döner.",
      get_shared_prompt: "/p/… ile paylaşılmış bir prompt'u getirir.",
      refine_prompt: "Claude, prompt'u aynı yapıyı koruyarak daha iyi bir sürüme yazar.",
    } as Record<string, string>,
    files: "Proje dosyaları (export_files · Pro)",
    filesLead: "Kodlama ajanlarının her oturumda okuduğu dosyalar — fikrinden tek seferde, deponun köküne yazılmaya hazır.",
    rest: "REST API",
    restLead: "Aynı motor, düz HTTP. Yanıtlar { data } ya da { error: { code, message } } biçiminde.",
    method: "Yöntem",
    path: "Yol",
    auth: "Kimlik",
    optional: "isteğe bağlı",
    required: "zorunlu",
    restRows: [
      ["GET", "/types", "Proje tipleri (?lang=EN|TR)"],
      ["GET", "/types/{id}", "Tipin hazır ayarı"],
      ["POST", "/generate", "Master prompt · uzman prompt'ları · Pro: dosyalar"],
      ["POST", "/refine", "Claude ile iyileştir (kredi)"],
      ["GET", "/shared/{slug}", "Paylaşılan prompt"],
    ],
    openapi: "OpenAPI 3.1 şeması",
    limits: "Planlar ve sınırlar",
    limitRows: (s: { free: number; pro: number; proDay: number; refine: number; keyRate: number; anonRate: number }) => [
      ["Free (anahtarsız da)", `3 uzman · ChatGPT Markdown ve Claude XML · günde ${s.free} AI kredisi (anahtarla)`],
      ["Monster Pro", `18 uzman · 5 format · proje dosyaları · ayda ${s.pro} AI kredisi (günde ≤${s.proDay})`],
      ["Kredi", `Prompt üretimi 0 · refine_prompt ${s.refine} kredi`],
      ["Hız", `Anahtarla dakikada ${s.keyRate}, anahtarsız ${s.anonRate} istek (MCP'de yalnız araç çağrıları sayılır)`],
    ],
    errors: "Hata kodları",
    errorRows: [
      ["401", "key_required, invalid_key", "Anahtar eksik, geçersiz ya da iptal edilmiş"],
      ["403", "pro_format, pro_files, banned", "Plan sınırı ya da askıya alınmış hesap"],
      ["429", "rate_limited", "Dakikalık sınır ya da AI kredisi doldu"],
      ["502", "ai_failed", "AI çağrısı başarısız — kredi düşülmez"],
      ["503", "api_disabled, mcp_disabled, maintenance", "Geçici olarak kapalı"],
    ],
    security: "Güvenlik",
    securityList: [
      "Anahtarın kendisini saklamayız; yalnız SHA-256 özeti tutulur ve anahtar bir kez gösterilir.",
      "Anahtarı istediğin an iptal edebilirsin; en fazla 5 aktif anahtar.",
      "Anahtarı depoya commit etme; VS Code kurulumu anahtarı güvenli giriş alanıyla sorar.",
      "AI çağrıları anahtar sahibinin planından düşer ve Kullanım geçmişinde görünür.",
    ],
    cta: "Anahtarını oluştur ve 2 dakikada bağlan",
    llms: "Ajanlar için özet",
  },
  en: {
    badge: "MCP · REST API · OpenAPI",
    h1: "Use Prompt.Monster from inside your editor",
    lead: "With the MCP server and the REST API, turn an idea into a master build prompt and agent files without leaving Claude Code, Cursor, VS Code, Windsurf, Claude Desktop or ChatGPT. Prompt generation is free and works without a key.",
    getKey: "Get an API key",
    quick: "Start in 3 steps",
    steps: [
      ["Get a key (optional)", "Create an API key in your account. Without a key the Free limits apply; AI refine and file exports need one."],
      ["Add the MCP server", "Pick your tool below — one command or a small JSON block."],
      ["Just ask", "Say “use prompt-monster to create a build prompt for an AI invoicing app for freelancers” — or run /mcp__prompt-monster__new_project in Claude Code."],
    ],
    setup: "Setup",
    endpoint: "MCP endpoint",
    tools: "MCP tools",
    tool: "Tool",
    does: "What it does",
    needs: "Needs",
    free: "Free",
    keyPro: "Key + Pro",
    keyCredits: (n: number) => `Key · ${n} credits`,
    toolRows: {
      list_project_types: "Lists project types (id, name, category, description).",
      get_type_preset: "A type's preset: experts, stack, v1 features, payments, monetization.",
      list_experts: "Lists the 18 expert personas.",
      generate_build_prompt: "Builds the master build prompt (or one prompt per expert) from the idea. Deterministic, no credits.",
      export_files: "Returns AGENTS.md, CLAUDE.md, .claude/agents, Cursor rules, Copilot instructions and a Task Master PRD.",
      get_shared_prompt: "Fetches a prompt shared at /p/….",
      refine_prompt: "Claude rewrites the prompt into a better version with the same structure.",
    } as Record<string, string>,
    files: "Project files (export_files · Pro)",
    filesLead: "The files coding agents read every session — generated from your idea in one go, ready to write to the repo root.",
    rest: "REST API",
    restLead: "Same engine, plain HTTP. Responses are { data } or { error: { code, message } }.",
    method: "Method",
    path: "Path",
    auth: "Auth",
    optional: "optional",
    required: "required",
    restRows: [
      ["GET", "/types", "Project types (?lang=EN|TR)"],
      ["GET", "/types/{id}", "A type's preset"],
      ["POST", "/generate", "Master prompt · expert prompts · Pro: files"],
      ["POST", "/refine", "Refine with Claude (credits)"],
      ["GET", "/shared/{slug}", "A shared prompt"],
    ],
    openapi: "OpenAPI 3.1 schema",
    limits: "Plans and limits",
    limitRows: (s: { free: number; pro: number; proDay: number; refine: number; keyRate: number; anonRate: number }) => [
      ["Free (also keyless)", `3 experts · ChatGPT Markdown and Claude XML · ${s.free} AI credits a day (with a key)`],
      ["Monster Pro", `18 experts · 5 formats · project files · ${s.pro} AI credits a month (≤${s.proDay} a day)`],
      ["Credits", `Prompt generation 0 · refine_prompt ${s.refine} credits`],
      ["Rate", `${s.keyRate} requests a minute with a key, ${s.anonRate} without (MCP counts tool calls only)`],
    ],
    errors: "Error codes",
    errorRows: [
      ["401", "key_required, invalid_key", "Key missing, invalid or revoked"],
      ["403", "pro_format, pro_files, banned", "Plan limit or suspended account"],
      ["429", "rate_limited", "Per-minute limit or AI credits used up"],
      ["502", "ai_failed", "The AI call failed — no credits used"],
      ["503", "api_disabled, mcp_disabled, maintenance", "Temporarily off"],
    ],
    security: "Security",
    securityList: [
      "We never store the key itself — only its SHA-256 hash — and show it once.",
      "Revoke a key any time; up to 5 active keys.",
      "Don't commit keys to a repository; the VS Code setup asks for the key in a secure input.",
      "AI calls are charged to the key owner's plan and show up in the usage history.",
    ],
    cta: "Create your key and connect in 2 minutes",
    llms: "Summary for agents",
  },
} as const;

const TOOL_ORDER: [string, "free" | "keyPro" | "credits"][] = [
  ["generate_build_prompt", "free"],
  ["list_project_types", "free"],
  ["get_type_preset", "free"],
  ["list_experts", "free"],
  ["export_files", "keyPro"],
  ["get_shared_prompt", "free"],
  ["refine_prompt", "credits"],
];

export async function DevelopersView({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = await readPublicSettings();
  const L = (p: string) => lhref(p, locale);
  const nums = {
    free: Number(s.free_credits_per_day),
    pro: Number(s.pro_credits_per_month),
    proDay: Number(s.pro_credits_per_day),
    refine: Number(s.credit_cost_refine),
    keyRate: 30,
    anonRate: 10,
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    name: "Prompt.Monster API & MCP server",
    description: DEV_META[locale].description,
    documentation: `https://prompter.monster${L("/developers")}`,
    url: API_BASE,
    provider: { "@type": "Organization", name: "Prompt.Monster", url: "https://prompter.monster" },
  };

  return (
    <PublicShell locale={locale} cta={{ href: L("/account/api"), label: t.getKey }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[960px] mx-auto px-4 lg:px-8 py-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <Plug className="w-3.5 h-3.5 text-lime" aria-hidden /> {t.badge}
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{t.h1}</h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-[720px]">{t.lead}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={L("/account/api")} className="h-11 px-5 rounded-xl bg-lime text-black text-[13px] font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4" aria-hidden /> {t.getKey}
          </Link>
          <a href={OPENAPI_URL} className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[13px] font-semibold flex items-center gap-2">
            <Braces className="w-4 h-4" aria-hidden /> {t.openapi}
          </a>
        </div>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.quick}</h2>
          <ol className="mt-4 grid md:grid-cols-3 gap-3">
            {t.steps.map(([title, body], i) => (
              <li key={title} className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
                <div className="w-7 h-7 rounded-lg bg-lime text-black text-[13px] font-black grid place-items-center">{i + 1}</div>
                <h3 className="mt-3 text-[14.5px] font-bold">{title}</h3>
                <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-lime" aria-hidden /> {t.setup}
            </h2>
            <div className="text-[12px] text-zinc-500 min-w-0">
              {t.endpoint}: <code className="text-zinc-200 break-all">{MCP_URL}</code>
            </div>
          </div>
          <SetupSnippets locale={locale} />
        </section>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.tools}</h2>
          <div className="mt-4 rounded-2xl border border-ink-600 overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-ink-900 text-[11px] tracking-widest text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t.tool.toUpperCase()}</th>
                  <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">{t.does.toUpperCase()}</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{t.needs.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600">
                {TOOL_ORDER.map(([name, need]) => (
                  <tr key={name} className="align-top">
                    <td className="px-4 py-3">
                      <code className="text-lime text-[12.5px] break-all">{name}</code>
                      <p className="sm:hidden mt-1 text-[12.5px] text-zinc-400">{t.toolRows[name]}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 hidden sm:table-cell">{t.toolRows[name]}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-[12px]">
                      {need === "free" ? t.free : need === "keyPro" ? t.keyPro : t.keyCredits(nums.refine)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-lime" aria-hidden /> {t.files}
          </h2>
          <p className="mt-2 text-[13.5px] text-zinc-400">{t.filesLead}</p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2">
            {PROJECT_FILES.map((f) => (
              <li key={f.id} className="rounded-xl bg-ink-900 border border-ink-600 px-4 py-3 min-w-0">
                <code className="text-[12.5px] text-zinc-100 break-all">{f.label}</code>
                <p className="mt-1 text-[12px] text-zinc-500">
                  {f.tool} — {f.desc[locale]}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.rest}</h2>
          <p className="mt-2 text-[13.5px] text-zinc-400">
            {t.restLead} Base URL: <code className="text-zinc-200 break-all">{API_BASE}</code>
          </p>
          <div className="mt-4 rounded-2xl border border-ink-600 overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-ink-900 text-[11px] tracking-widest text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t.method.toUpperCase()}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.path.toUpperCase()}</th>
                  <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">{t.auth.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600">
                {t.restRows.map(([m, p, d]) => (
                  <tr key={p} className="align-top">
                    <td className="px-4 py-3">
                      <span className={m === "GET" ? "text-sky-300 font-bold text-[12px]" : "text-lime font-bold text-[12px]"}>{m}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-zinc-100 text-[12.5px] break-all">{p}</code>
                      <p className="mt-1 text-[12px] text-zinc-500">{d}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-zinc-400 hidden sm:table-cell whitespace-nowrap">{p === "/refine" ? t.required : t.optional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12.5px] text-zinc-500">
            <a href={OPENAPI_URL} className="text-lime hover:underline">
              {t.openapi}
            </a>{" "}
            · Authorization: Bearer pm_live_…
          </p>
        </section>

        <section className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
            <h2 className="text-[16px] font-bold">{t.limits}</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              {t.limitRows(nums).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-semibold text-zinc-200">{k}</dt>
                  <dd className="text-zinc-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
            <h2 className="text-[16px] font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lime" aria-hidden /> {t.security}
            </h2>
            <ul className="mt-3 space-y-2 text-[13px] text-zinc-400">
              {t.securityList.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.errors}</h2>
          <div className="mt-4 rounded-2xl border border-ink-600 overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <tbody className="divide-y divide-ink-600">
                {t.errorRows.map(([status, codes, text]) => (
                  <tr key={status} className="align-top">
                    <td className="px-4 py-3 font-bold text-zinc-200 w-16">{status}</td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] text-zinc-300 break-words">{codes}</code>
                      <p className="mt-1 text-[12px] text-zinc-500">{text}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold">{t.cta}</h2>
            <p className="mt-1 text-[12.5px] text-zinc-400">
              {t.llms}:{" "}
              <a href="/llms.txt" className="text-lime hover:underline">
                /llms.txt
              </a>
            </p>
          </div>
          <Link href={L("/account/api")} className="h-11 px-5 rounded-xl bg-lime text-black text-[13px] font-bold flex items-center justify-center gap-2 shrink-0">
            {t.getKey} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
