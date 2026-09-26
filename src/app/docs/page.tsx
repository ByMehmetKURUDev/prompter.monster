import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, CheckCircle2, XCircle } from "lucide-react";
import { PublicShell } from "@/components/site/PublicShell";
import { AGENT_GUIDE, FIELD_GUIDE, SITE, TOOL_GUIDE } from "@/lib/docs";

const TITLE = "Studio rehberi: iyi bir build prompt için ne yazmalı?";
const DESCRIPTION = "Prompt.Monster'da her alana ne yazmalı, hangi uzmanları seçmeli, çıktıyı Claude Code / Cursor / v0 / Lovable'a nasıl vermeli — örneklerle. AI ajanları için /llms.txt.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/docs` },
  openGraph: { title: `${TITLE} · Prompt.Monster`, description: DESCRIPTION, url: `${SITE}/docs`, siteName: "Prompt.Monster", locale: "tr_TR", type: "article" },
  robots: { index: true, follow: true },
};

const STEP_NAMES = { 1: "1 · Fikir & Vizyon", 2: "2 · Teknoloji", 3: "3 · Özellikler & Ödeme", 4: "4 · Uzmanlar & Üret" } as const;

export default function DocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: TITLE,
    description: DESCRIPTION,
    step: FIELD_GUIDE.map((f, i) => ({ "@type": "HowToStep", position: i + 1, name: f.field, text: f.how })),
  };
  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[900px] mx-auto px-4 lg:px-8 py-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <BookOpen className="w-3.5 h-3.5 text-lime" aria-hidden /> Rehber
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{TITLE}</h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-[720px]">
          Prompt&apos;un kalitesi girdinin kalitesi kadardır. Aşağıda Studio&apos;daki her alan için ne yazman gerektiğini, iyi ve kötü örnekleri ve
          çıktıyı hangi araca nasıl vereceğini bulacaksın. Bir AI ajanı kullanıyorsan aynı bilgiyi{" "}
          <a href="/llms.txt" className="text-lime hover:underline">
            /llms.txt
          </a>{" "}
          adresinden okuyabilir.
        </p>

        <div className="mt-8 rounded-2xl border border-ink-600 bg-ink-900 p-5 text-[13px] text-zinc-300 leading-relaxed">
          <strong className="text-white">Altın kural:</strong> Somut ol. &quot;Modern ve hızlı bir platform&quot; yerine kim için, hangi işi, bugünkü çözümden nasıl farklı yaptığını yaz. Sayı,
          isim ve sınır ver (&quot;ilk sürümde X yok&quot;). Uzmanlar belirsizliği doldurmaz; kararı senden bekler.
        </div>

        {/* Field guide */}
        {([1, 2, 3, 4] as const).map((step) => (
          <section key={step} className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{STEP_NAMES[step]}</h2>
            <div className="mt-4 space-y-4">
              {FIELD_GUIDE.filter((f) => f.step === step).map((f) => (
                <article key={f.field} className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
                  <h3 className="text-[15px] font-bold">{f.field}</h3>
                  <p className="mt-1 text-[12.5px] text-zinc-500">{f.what}</p>
                  <p className="mt-3 text-[13.5px] text-zinc-300 leading-relaxed">{f.how}</p>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-[12.5px]">
                    <div className="rounded-xl border border-lime/30 bg-lime/5 p-3">
                      <div className="flex items-center gap-1.5 text-lime font-semibold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> İyi
                      </div>
                      <p className="text-zinc-300">{f.good}</p>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                        <XCircle className="w-3.5 h-3.5" aria-hidden /> Zayıf
                      </div>
                      <p className="text-zinc-400">{f.bad}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Tools */}
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Çıktıyı araca verme</h2>
          <p className="mt-2 text-[13px] text-zinc-500">Format aracın dilidir; yanlış format çalışır ama daha kötü sonuç verir.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {TOOL_GUIDE.map((t) => (
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

        {/* Chain */}
        <section className="mt-12 rounded-2xl bg-ink-800 border border-ink-600 p-5">
          <h2 className="text-[15px] font-bold">Mega Chain&apos;i adım adım vermek</h2>
          <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed">
            Mega Chain 8 adımdır ve her adım bir öncekinin çıktısını kullanır. Tamamını tek mesajda vermek yerine &quot;Adım 1&quot; deyip PRD&apos;yi onayla, sonra &quot;Adım 2&quot;
            de. Böylece araç her adımda senin düzeltmelerini taşır ve context şişmez.
          </p>
          <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] text-zinc-300">
            {AGENT_GUIDE.chain.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-mono text-zinc-600 w-4">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </section>

        {/* Agents */}
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet" aria-hidden /> AI ajanları ve otomasyon
          </h2>
          <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed max-w-[720px]">
            Prompt.Monster&apos;ı bir ajan (Claude Code, Cursor, OpenClaw, n8n…) içinden kullanmak için bugün şu kapılar açık; MCP sunucusu ve Chrome eklentisi yolda.
          </p>
          <div className="mt-4 rounded-2xl bg-ink-900 border border-ink-600 p-5 text-[12.5px] font-mono text-zinc-300 space-y-2 overflow-x-auto">
            <div>
              <span className="text-zinc-500"># tip ön ayarlarıyla Studio&apos;yu aç</span>
              <br />
              {AGENT_GUIDE.quickStart}
            </div>
            <div>
              <span className="text-zinc-500"># paylaşılan bir prompt&apos;u JSON olarak oku</span>
              <br />
              {AGENT_GUIDE.shareApi}
            </div>
            <div>
              <span className="text-zinc-500"># makine okunur rehber</span>
              <br />
              {SITE}/llms.txt
            </div>
          </div>
          <details className="mt-3 rounded-2xl bg-ink-900 border border-ink-600 p-5 text-[13px]">
            <summary className="cursor-pointer font-semibold">Proje tipi kimlikleri ({AGENT_GUIDE.typeIds.length})</summary>
            <ul className="mt-3 grid sm:grid-cols-2 gap-1 text-[12px] text-zinc-400">
              {AGENT_GUIDE.typeIds.map((t) => (
                <li key={t.id}>
                  <code className="text-zinc-200">{t.id}</code> — {t.name}{" "}
                  {t.page && (
                    <Link href={t.page.replace(SITE, "")} className="text-lime hover:underline">
                      sayfa
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Hazırsan Studio seni bekliyor.</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">Bu rehberdeki örnek cümleleri şablon olarak kullan; 10 dakikada ilk master prompt&apos;un hazır.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/studio?new=1" className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              Studio&apos;yu aç <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/prompt" className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              Proje tipine göre başla
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
