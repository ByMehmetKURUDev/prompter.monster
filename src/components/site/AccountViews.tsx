import { BookOpen, Crown } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiKeysPanel, type KeyItem } from "@/components/account/ApiKeysPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { LibraryList } from "@/components/library/LibraryList";
import { MAX_ACTIVE_KEYS } from "@/lib/api-keys";
import { KEY_COLUMNS } from "@/lib/api-keys-server";
import type { ProjectSummary } from "@/lib/db";
import { limitsFor } from "@/lib/plans";
import { readServerSettings } from "@/lib/settings-server";
import { lhref, type Locale } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { LanguageSwitch } from "./LanguageSwitch";

const COPY = {
  tr: {
    library: "Projelerim",
    libraryText: "Kaydettiğin canavarlar ve versiyonları. Aç deyince Studio son versiyonla yüklenir.",
    newMonster: "+ Yeni canavar",
    signOut: "Çıkış",
    newPassword: "Yeni şifre belirle",
    backStudio: "Studio'ya dön",
    apiTitle: "API ve MCP",
    apiText: "Prompt.Monster'ı Claude Code, Cursor, VS Code, Windsurf, Claude Desktop ve ChatGPT'den kullan. Prompt üretimi ücretsiz; AI iyileştirme planının kredisini harcar.",
    docs: "Dokümantasyon",
    plan: "Planın",
    viaApi: "API / MCP üzerinden",
    experts: (n: number) => `${n} uzman`,
    formats: (n: number) => `${n} format`,
    files: "Proje dosyaları (AGENTS.md, CLAUDE.md, .claude/agents …)",
    noFiles: "Proje dosyası export'u Pro'da",
    credits: (d: number, m: number | null) => (m ? `Ayda ${m} AI kredisi (günde ≤${d})` : `Günde ${d} AI kredisi`),
    rate: (k: number, a: number) => `Dakikada ${k} istek (anahtarsız: ${a})`,
    upgrade: "Pro'ya geç",
    off: (what: string) => `${what} şu an bakım için kapalı; anahtarların saklanıyor.`,
  },
  en: {
    library: "My projects",
    libraryText: "Your saved monsters and their versions. Open one and the Studio loads its latest version.",
    newMonster: "+ New monster",
    signOut: "Sign out",
    newPassword: "Set a new password",
    backStudio: "Back to the Studio",
    apiTitle: "API & MCP",
    apiText: "Use Prompt.Monster from Claude Code, Cursor, VS Code, Windsurf, Claude Desktop and ChatGPT. Prompt generation is free; AI refine spends your plan's credits.",
    docs: "Documentation",
    plan: "Your plan",
    viaApi: "Through the API / MCP",
    experts: (n: number) => `${n} experts`,
    formats: (n: number) => `${n} formats`,
    files: "Project files (AGENTS.md, CLAUDE.md, .claude/agents …)",
    noFiles: "Project file exports are on Pro",
    credits: (d: number, m: number | null) => (m ? `${m} AI credits a month (≤${d} a day)` : `${d} AI credits a day`),
    rate: (k: number, a: number) => `${k} requests a minute (without a key: ${a})`,
    upgrade: "Go Pro",
    off: (what: string) => `${what} is switched off for maintenance right now; your keys are kept.`,
  },
} as const;

function Brand({ locale }: { locale: Locale }) {
  return (
    <Link href={lhref("/", locale)} className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
      <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
    </Link>
  );
}

/** Only same-site relative paths are allowed as ?next= (no open redirects). */
export function safeNext(next: string | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function LoginPageView({ locale, searchParams }: { locale: Locale; searchParams: { next?: string; error?: string; msg?: string } }) {
  const next = safeNext(searchParams.next, lhref("/studio", locale));
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 flex flex-col">
      <header className="h-[56px] border-b border-ink-600 flex items-center px-4 lg:px-8 gap-4">
        <Brand locale={locale} />
        <div className="ml-auto">
          <LanguageSwitch />
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-4 py-12">
        <LoginForm next={next} initialError={searchParams.error} initialMessage={searchParams.msg} />
      </main>
    </div>
  );
}

export async function PasswordPageView({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  if (!supabaseConfigured()) redirect(lhref("/studio", locale));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${lhref("/login", locale)}?next=${encodeURIComponent(lhref("/account/password", locale))}`);

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 flex flex-col">
      <header className="h-[56px] border-b border-ink-600 flex items-center px-4 lg:px-8">
        <Brand locale={locale} />
      </header>
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime to-violet grid place-items-center text-black text-xl">🔑</div>
            <div>
              <h1 className="text-[18px] font-bold">{c.newPassword}</h1>
              <p className="text-[12px] text-zinc-500 truncate max-w-[300px]">{user.email}</p>
            </div>
          </div>
          <PasswordForm />
          <p className="mt-6 text-[11px] text-zinc-600">
            <Link href={lhref("/studio", locale)} className="text-zinc-400 underline">
              {c.backStudio}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export async function LibraryPageView({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  if (!supabaseConfigured()) redirect(lhref("/studio", locale));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${lhref("/login", locale)}?next=${encodeURIComponent(lhref("/library", locale))}`);

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,project_type,updated_at,created_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200);
  const { data: gens } = await supabase.from("generations").select("project_id,version").eq("owner_id", user.id);
  const byProject = new Map<string, number[]>();
  (gens ?? []).forEach((g) => byProject.set(g.project_id, [...(byProject.get(g.project_id) ?? []), g.version]));
  const items: ProjectSummary[] = (projects ?? []).map((p) => {
    const v = byProject.get(p.id) ?? [];
    return { ...p, versions: v.length, latest_version: v.length ? Math.max(...v) : null };
  });

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Brand locale={locale} />
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="hidden sm:block text-zinc-500 truncate max-w-[240px]">{user.email}</span>
          <LanguageSwitch />
          <Link href={lhref("/studio", locale)} className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center">
            Studio
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-zinc-300">
              {c.signOut}
            </button>
          </form>
        </nav>
      </header>
      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{c.library}</h1>
            <p className="text-[13px] text-zinc-500 mt-1">{c.libraryText}</p>
          </div>
          <Link href={`${lhref("/studio", locale)}?new=1`} className="h-10 px-4 rounded-lg bg-ink-800 border border-ink-600 text-[13px] font-semibold flex items-center shrink-0">
            {c.newMonster}
          </Link>
        </div>
        <LibraryList initial={items} />
      </main>
    </div>
  );
}

export async function ApiAccountView({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  if (!supabaseConfigured()) redirect(lhref("/developers", locale));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${lhref("/login", locale)}?next=${encodeURIComponent(lhref("/account/api", locale))}`);

  const [{ data: keys }, { data: prof }, s] = await Promise.all([
    supabase.from("api_keys").select(KEY_COLUMNS).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle<{ plan: string }>(),
    readServerSettings(),
  ]);
  const plan = prof?.plan === "pro" ? "pro" : "free";
  const limits = limitsFor(plan);
  const perDay = Number(plan === "pro" ? s.pro_credits_per_day : s.free_credits_per_day);
  const perMonth = plan === "pro" ? Number(s.pro_credits_per_month) : null;
  const off = [!s.api_enabled && "REST API", !s.mcp_enabled && "MCP"].filter(Boolean).join(" + ");

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Brand locale={locale} />
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="hidden md:block text-zinc-500 truncate max-w-[240px]">{user.email}</span>
          <LanguageSwitch />
          <Link href={lhref("/studio", locale)} className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center">
            Studio
          </Link>
        </nav>
      </header>
      <main className="max-w-[900px] mx-auto px-4 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{c.apiTitle}</h1>
            <p className="text-[13px] text-zinc-400 mt-1 max-w-[560px]">{c.apiText}</p>
          </div>
          <Link href={lhref("/developers", locale)} className="h-10 px-4 rounded-lg bg-ink-800 border border-ink-600 text-[13px] font-semibold flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <BookOpen className="w-4 h-4" aria-hidden /> {c.docs}
          </Link>
        </div>

        {off && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-200">{c.off(off)}</p>}

        <section className="rounded-2xl bg-ink-800 border border-ink-600 p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="shrink-0">
            <div className="text-[11px] tracking-widest text-zinc-500 font-semibold">{c.plan.toUpperCase()}</div>
            <div className="mt-1 flex items-center gap-2 text-[18px] font-bold">
              <Crown className="w-4 h-4 text-lime" aria-hidden /> {plan === "pro" ? "Monster Pro" : "Free"}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-[12.5px] text-zinc-300">
            <div className="text-[11px] tracking-widest text-zinc-500 font-semibold mb-1">{c.viaApi.toUpperCase()}</div>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
              <li>• {c.experts(limits.experts)} · {c.formats(limits.formats.length)}</li>
              <li>• {limits.builders ? c.files : c.noFiles}</li>
              <li>• {c.credits(perDay, perMonth)}</li>
              <li>• {c.rate(Number(s.api_rate_per_minute) || 30, Number(s.api_anon_rate_per_minute) || 10)}</li>
            </ul>
          </div>
          {plan !== "pro" && (
            <Link href={lhref("/pricing", locale)} className="h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold flex items-center justify-center shrink-0">
              {c.upgrade}
            </Link>
          )}
        </section>

        <ApiKeysPanel locale={locale} initial={(keys ?? []) as KeyItem[]} max={MAX_ACTIVE_KEYS} />
      </main>
    </div>
  );
}
