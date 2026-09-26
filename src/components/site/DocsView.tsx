import Link from "next/link";
import { ArrowRight, BookOpen, Bot, CheckCircle2, XCircle } from "lucide-react";
import { AGENT_GUIDE, FIELD_GUIDE, SITE, TOOL_GUIDE } from "@/lib/docs";
import { AGENT_GUIDE_EN, DOCS_UI_EN, DOCS_UI_TR, FIELD_GUIDE_EN, TOOL_GUIDE_EN } from "@/lib/docs-en";
import { lhref, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";

export function docsUi(locale: Locale) {
  return locale === "en" ? DOCS_UI_EN : DOCS_UI_TR;
}

/** The Studio guide (/docs and /en/docs). */
export function DocsView({ locale }: { locale: Locale }) {
  const ui = docsUi(locale);
  const fields = locale === "en" ? FIELD_GUIDE_EN : FIELD_GUIDE;
  const tools = locale === "en" ? TOOL_GUIDE_EN : TOOL_GUIDE;
  const agents = locale === "en" ? AGENT_GUIDE_EN : AGENT_GUIDE;
  const L = (p: string) => lhref(p, locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: ui.title,
    description: ui.description,
    inLanguage: locale,
    step: fields.map((f, i) => ({ "@type": "HowToStep", position: i + 1, name: f.field, text: f.how })),
  };
  return (
    <PublicShell locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[900px] mx-auto px-4 lg:px-8 py-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <BookOpen className="w-3.5 h-3.5 text-lime" aria-hidden /> {ui.badge}
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{ui.title}</h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-[720px]">
          {ui.introBeforeLink}{" "}
          <a href="/llms.txt" className="text-lime hover:underline">
            /llms.txt
          </a>{" "}
          {ui.introAfterLink}
        </p>

        <div className="mt-8 rounded-2xl border border-ink-600 bg-ink-900 p-5 text-[13px] text-zinc-300 leading-relaxed">
          <strong className="text-white">{ui.goldenRuleLabel}</strong> {ui.goldenRule}
        </div>

        {([1, 2, 3, 4] as const).map((step) => (
          <section key={step} className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{ui.stepNames[step]}</h2>
            <div className="mt-4 space-y-4">
              {fields
                .filter((f) => f.step === step)
                .map((f) => (
                  <article key={f.field} className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
                    <h3 className="text-[15px] font-bold">{f.field}</h3>
                    <p className="mt-1 text-[12.5px] text-zinc-500">{f.what}</p>
                    <p className="mt-3 text-[13.5px] text-zinc-300 leading-relaxed">{f.how}</p>
                    <div className="mt-4 grid sm:grid-cols-2 gap-3 text-[12.5px]">
                      <div className="rounded-xl border border-lime/30 bg-lime/5 p-3">
                        <div className="flex items-center gap-1.5 text-lime font-semibold mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> {ui.good}
                        </div>
                        <p className="text-zinc-300">{f.good}</p>
                      </div>
                      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                        <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                          <XCircle className="w-3.5 h-3.5" aria-hidden /> {ui.bad}
                        </div>
                        <p className="text-zinc-400">{f.bad}</p>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{ui.toolsTitle}</h2>
          <p className="mt-2 text-[13px] text-zinc-500">{ui.toolsIntro}</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {tools.map((t) => (
              <article key={t.tool} className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
                <h3 className="text-[15px] font-bold">{t.tool}</h3>
                <div className="mt-1 text-[12px] text-lime">{t.format}</div>
                <ol className="mt-3 space-y-1.5 text-[13px] text-zinc-300 list-decimal pl-4">
                  {t.how.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-ink-800 border border-ink-600 p-5">
          <h2 className="text-[15px] font-bold">{ui.chainTitle}</h2>
          <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed">{ui.chainIntro}</p>
          <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] text-zinc-300">
            {agents.chain.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-mono text-zinc-600 w-4">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet" aria-hidden /> {ui.agentsTitle}
          </h2>
          <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed max-w-[720px]">{ui.agentsIntro}</p>
          <div className="mt-4 rounded-2xl bg-ink-900 border border-ink-600 p-5 text-[12.5px] font-mono text-zinc-300 space-y-2 overflow-x-auto">
            <div>
              <span className="text-zinc-500">{ui.quickStartComment}</span>
              <br />
              {agents.quickStart}
            </div>
            <div>
              <span className="text-zinc-500">{ui.shareApiComment}</span>
              <br />
              {agents.shareApi}
            </div>
            <div>
              <span className="text-zinc-500">{ui.llmsTxtComment}</span>
              <br />
              {SITE}/llms.txt
            </div>
          </div>
          <details className="mt-3 rounded-2xl bg-ink-900 border border-ink-600 p-5 text-[13px]">
            <summary className="cursor-pointer font-semibold">
              {ui.typeIdsSummary} ({agents.typeIds.length})
            </summary>
            <ul className="mt-3 grid sm:grid-cols-2 gap-1 text-[12px] text-zinc-400">
              {agents.typeIds.map((t) => (
                <li key={t.id}>
                  <code className="text-zinc-200">{t.id}</code> — {t.name}{" "}
                  {t.page && (
                    <Link href={L(t.page.replace(SITE, ""))} className="text-lime hover:underline">
                      {ui.typePageLink}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{ui.ctaTitle}</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">{ui.ctaText}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={L("/studio?new=1")} className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              {ui.ctaButton} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href={L("/prompt")} className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              {ui.ctaSecondary}
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
