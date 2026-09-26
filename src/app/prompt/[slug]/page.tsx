import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Layers, ShieldCheck, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { PublicShell } from "@/components/site/PublicShell";
import { MEGA_CHAIN_STEPS } from "@/lib/data";
import { SITE, categoryOf, expertsFor, paymentsFor, promptExcerpt, relatedPages, stackFor } from "@/lib/seo";
import { TYPE_PAGE_BY_SLUG } from "@/lib/seo-types";

// Rendered on demand: the Workers deployment has no incremental cache, so prerendered dynamic
// routes (generateStaticParams) would 404 there. Content is in code, so rendering is instant.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const GENERIC_FAQ = [
  {
    q: "Üretilen prompt'u hangi araçlara yapıştırabilirim?",
    a: "Claude Code, Cursor, Windsurf, v0, Lovable, Bolt ve ChatGPT. Çıktı formatını (Claude XML, ChatGPT Markdown, Cursor Rules, v0, Lovable/Bolt) Studio'nun 4. adımında seçersin; .cursorrules ve CLAUDE.md olarak da indirebilirsin.",
  },
  {
    q: "Ücretsiz mi?",
    a: "Evet. Free planda 3 uzman ve 2 format ile sınırsız prompt üretirsin; kart gerekmez. 12 uzman, Mega Chain ve Export to Builders Monster Pro'da ($29/ay).",
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = TYPE_PAGE_BY_SLUG.get(slug);
  if (!page) return { title: "Sayfa bulunamadı", robots: { index: false } };
  const url = `${SITE}/prompt/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: { type: "article", title: `${page.title} · Prompt.Monster`, description: page.description, url, siteName: "Prompt.Monster", locale: "tr_TR" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
    robots: { index: true, follow: true },
  };
}

export default async function TypePromptPage({ params }: Props) {
  const { slug } = await params;
  const page = TYPE_PAGE_BY_SLUG.get(slug);
  if (!page) notFound();

  const category = categoryOf(page.id);
  const experts = expertsFor(page);
  const payments = paymentsFor(page);
  const stack = stackFor(page.id);
  const excerpt = promptExcerpt(page);
  const related = relatedPages(page);
  const faq = [...page.faq, ...GENERIC_FAQ];
  const url = `${SITE}/prompt/${page.slug}`;
  const studioHref = `/studio?type=${encodeURIComponent(page.id)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Prompt.Monster", item: SITE },
        { "@type": "ListItem", position: 2, name: "Build prompt'lar", item: `${SITE}/prompt` },
        { "@type": "ListItem", position: 3, name: page.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.description,
      url,
      inLanguage: "tr",
      isPartOf: { "@type": "WebSite", name: "Prompt.Monster", url: SITE },
      about: { "@type": "Thing", name: page.name },
    },
  ];

  return (
    <PublicShell cta={{ href: studioHref, label: "Prompt üret" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Ana sayfa
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <Link href="/prompt" className="hover:text-zinc-300">
            Build prompt&apos;lar
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <span className="text-zinc-300">{page.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
          {category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-ink-800 border border-ink-600">
              <span aria-hidden>{category.item.icon}</span> {category.label}
            </span>
          )}
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{experts.length} uzman</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{page.features.length} özellik</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{MEGA_CHAIN_STEPS.length} adımlı Mega Chain</span>
        </div>

        <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{page.title}</h1>
        <p className="mt-4 text-[15px] md:text-[17px] text-zinc-400 max-w-[760px] leading-relaxed">{page.description}</p>
        <p className="mt-2 text-[13px] text-zinc-500">
          Kimler için: <span className="text-zinc-300">{page.audience}</span>
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={studioHref} className="h-12 px-6 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2 shadow-[0_0_30px_rgba(163,255,18,0.25)]">
            {page.name} prompt&apos;u üret <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <a href="#ornek" className="h-12 px-6 rounded-xl bg-ink-800 border border-ink-600 text-[14px] font-medium flex items-center">
            Örnek prompt&apos;u gör
          </a>
        </div>

        <section className="mt-12 grid md:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="space-y-4 text-[14px] md:text-[15px] text-zinc-300 leading-relaxed">
            <p>{page.intro[0]}</p>
            <p>{page.intro[1]}</p>
          </div>
          <aside className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
            <div className="text-[11px] font-bold tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-lime" aria-hidden /> NASIL ÇALIŞIR
            </div>
            <ol className="mt-3 space-y-2 text-[13px] text-zinc-300">
              {[
                `"${page.name}" tipini seç, adını ve fikrini bir cümleyle yaz.`,
                "Önerilen stack ve özellikleri onayla ya da değiştir.",
                `${experts.length} uzman personayı seçili bul; istersen 12'ye çıkar.`,
                "Formatı seç, üret, kopyala; Claude Code / Cursor / v0'a yapıştır.",
              ].map((t, i) => (
                <li key={t} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-ink-950 border border-ink-600 grid place-items-center text-[10px] font-mono text-zinc-500 shrink-0">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* Experts */}
        <section className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-violet" aria-hidden /> Bu prompt&apos;u yazan uzmanlar
          </h2>
          <p className="mt-2 text-[13px] text-zinc-500">Her uzman kendi görev bloğunu, kısıtlarını ve başarı kriterlerini prompt&apos;a ekler. {page.name} için varsayılan seçim:</p>
          <div className="mt-5 grid md:grid-cols-2 gap-3">
            {experts.map((e) => (
              <article key={e.id} className="rounded-2xl bg-ink-800 border border-ink-600 p-4 flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-xl shrink-0">{e.emoji}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold">{e.role}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-600 border border-ink-400 text-zinc-400">{e.years}y</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {e.org} • {e.spec}
                  </div>
                  <p className="mt-2 text-[12px] text-zinc-400 leading-relaxed line-clamp-3">{e.task}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Stack + features */}
        <section className="mt-14 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
            <h2 className="text-[15px] font-bold tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime" aria-hidden /> Önerilen stack
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500">Studio&apos;nun 2. adımında hazır gelir; 7 katmandan istediğini değiştir.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {stack.map((x) => (
                <li key={x} className="px-3 h-8 rounded-lg bg-ink-950 border border-ink-600 text-[12px] font-mono flex items-center">
                  {x}
                </li>
              ))}
            </ul>
            {(payments.length > 0 || page.monetization.length > 0) && (
              <>
                <h3 className="mt-6 text-[13px] font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-violet" aria-hidden /> Ödeme & gelir modeli
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {page.monetization.map((m) => (
                    <li key={m} className="px-2.5 h-7 rounded-full bg-violet/10 border border-violet/30 text-violet text-[11px] flex items-center">
                      {m}
                    </li>
                  ))}
                  {payments.map((p) => (
                    <li key={p.id} className="px-2.5 h-7 rounded-full bg-ink-950 border border-ink-600 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} aria-hidden /> {p.name}
                      <span className="text-zinc-600">{p.fee}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {page.compliance && page.compliance.length > 0 && (
              <>
                <h3 className="mt-6 text-[13px] font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-lime" aria-hidden /> Uyum
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {page.compliance.map((c) => (
                    <li key={c} className="px-2.5 h-7 rounded-full bg-lime/10 border border-lime/30 text-lime text-[11px] flex items-center">
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
            <h2 className="text-[15px] font-bold tracking-tight flex items-center gap-2">
              <Check className="w-4 h-4 text-lime" aria-hidden /> Prompt&apos;a giren özellikler
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500">Her özellik prompt&apos;ta &quot;Spec + API + UI + Test&quot; satırı olarak yer alır.</p>
            <ul className="mt-4 space-y-2">
              {page.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-zinc-300">
                  <span className="w-4 h-4 rounded border border-lime/50 bg-lime/10 grid place-items-center shrink-0">
                    <Check className="w-3 h-3 text-lime" aria-hidden />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sample */}
        <section id="ornek" className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lime" aria-hidden /> Örnek prompt (kısaltılmış)
          </h2>
          <p className="mt-2 text-[13px] text-zinc-500 max-w-[720px]">
            Örnek fikir: <em className="text-zinc-300 not-italic">&quot;{page.samplePitch}&quot;</em>. Aşağıda master prompt&apos;un başlığı ve ilk uzmanın bloğu var; Studio tam metni
            {" "}
            {experts.length} uzman × {MEGA_CHAIN_STEPS.length} adım olarak üretir.
          </p>
          <div className="mt-5 rounded-2xl bg-ink-900 border border-ink-600 overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-11 border-b border-ink-600 text-[11px] font-semibold tracking-widest text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden /> {page.name.toUpperCase()} — MASTER BUILD PROMPT
              <span className="ml-auto font-normal tracking-normal text-zinc-600">Claude XML • TR</span>
            </div>
            <pre className="mono text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words p-4 md:p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">{excerpt.text}</pre>
            <div className="border-t border-ink-600 px-4 py-3 flex flex-wrap items-center gap-3 text-[12px] text-zinc-500">
              <span>{excerpt.truncated ? "Devamı Studio'da: tüm uzman blokları, özellik matrisi ve Mega Chain." : "Tam metin Studio'da üretilir."}</span>
              <Link href={studioHref} className="ml-auto text-lime font-semibold flex items-center gap-1">
                Tam prompt&apos;u üret <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-ink-800 border border-ink-600 p-5">
            <h3 className="text-[13px] font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet" aria-hidden /> Mega Chain: {MEGA_CHAIN_STEPS.length} adımda full-stack {page.name}
            </h3>
            <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-zinc-400">
              {MEGA_CHAIN_STEPS.map((st, i) => (
                <li key={st} className="flex gap-2">
                  <span className="font-mono text-zinc-600 w-4 shrink-0">{i + 1}.</span> {st}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Sık sorulanlar</h2>
          <div className="mt-5 divide-y divide-ink-600 rounded-2xl border border-ink-600 bg-ink-900">
            {faq.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-[14px] font-semibold">
                  <h3 className="text-[14px] font-semibold">{f.q}</h3>
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5 transition group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Benzer proje tipleri</h2>
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => {
                const c = categoryOf(r.id);
                return (
                  <Link key={r.slug} href={`/prompt/${r.slug}`} className="rounded-2xl bg-ink-800 border border-ink-600 hover:border-ink-400 p-4 transition group">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {c?.item.icon}
                      </span>
                      <span className="text-[14px] font-semibold group-hover:text-lime transition">{r.name}</span>
                    </div>
                    <p className="mt-2 text-[12px] text-zinc-500 leading-relaxed line-clamp-2">{r.description}</p>
                  </Link>
                );
              })}
            </div>
            <Link href="/prompt" className="mt-4 inline-flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white">
              Tüm proje tipleri <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </section>
        )}

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{page.name} fikrini 4 adımda master prompt&apos;a çevir.</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">
            Uzmanlar, stack ve özellikler bu sayfadaki gibi hazır gelir; sen adını ve fikrini yaz. Ücretsiz, kart gerekmez.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={studioHref} className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              Ücretsiz üret <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/pricing" className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              Pro ile 12 uzman + Mega Chain
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
