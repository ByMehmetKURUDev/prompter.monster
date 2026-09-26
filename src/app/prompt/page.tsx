import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/site/PublicShell";
import { EXPERTS, FORMATS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { SITE, categoryOf, pagesByCategory } from "@/lib/seo";
import { TYPE_PAGES } from "@/lib/seo-types";

const TITLE = "Proje tipine göre master build prompt'lar";
const DESCRIPTION = `${TYPE_PAGES.length} proje tipi için hazır build prompt şablonu: SaaS dashboard, AI wrapper, e-ticaret, marketplace, fintech, LMS, telemedicine ve daha fazlası. Claude Code, Cursor, v0, Lovable ve Bolt için.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/prompt` },
  openGraph: { title: `${TITLE} · Prompt.Monster`, description: DESCRIPTION, url: `${SITE}/prompt`, siteName: "Prompt.Monster", locale: "tr_TR", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function PromptHubPage() {
  const groups = pagesByCategory();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Prompt.Monster", item: SITE },
        { "@type": "ListItem", position: 2, name: "Build prompt'lar", item: `${SITE}/prompt` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: TITLE,
      numberOfItems: TYPE_PAGES.length,
      itemListElement: TYPE_PAGES.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${SITE}/prompt/${p.slug}` })),
    },
  ];

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-[1100px] mx-auto px-4 lg:px-8 py-12">
        <div className="text-center max-w-[720px] mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden /> {TYPE_PAGES.length} proje tipi • {EXPERTS.length} uzman • {FORMATS.length} format
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{TITLE}</h1>
          <p className="mt-4 text-[14px] md:text-[16px] text-zinc-400 leading-relaxed">
            Her sayfa bir proje tipi için önerilen uzmanları, stack&apos;i, özellik listesini ve kısaltılmış örnek prompt&apos;u gösterir. Beğendiğin tipi seç; Studio o
            ayarlarla açılır, sen sadece fikrini yazarsın.
          </p>
        </div>

        {groups.map((g) => (
          <section key={g.cat} className="mt-12">
            <h2 className="text-[12px] font-bold tracking-widest text-zinc-400">{g.cat}</h2>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.pages.map((p) => {
                const c = categoryOf(p.id);
                return (
                  <Link key={p.slug} href={`/prompt/${p.slug}`} className="rounded-2xl bg-ink-800 border border-ink-600 hover:border-ink-400 p-5 transition group flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-xl shrink-0" aria-hidden>
                        {c?.item.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold group-hover:text-lime transition truncate">{p.name}</h3>
                        <div className="text-[11px] text-zinc-500">
                          {p.experts.length} uzman • {p.features.length} özellik
                        </div>
                      </div>
                      {c?.item.badge && (
                        <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-lime/15 text-lime border border-lime/30 shrink-0">{c.item.badge}</span>
                      )}
                    </div>
                    <p className="mt-3 text-[12px] text-zinc-500 leading-relaxed line-clamp-3 flex-1">{p.description}</p>
                    <span className="mt-4 text-[12px] text-zinc-400 group-hover:text-white flex items-center gap-1">
                      Prompt&apos;u incele <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-16 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Listede olmayan bir fikrin mi var?</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">
            Studio boş projeyle de çalışır: tipini seç ya da seçme, {MEGA_CHAIN_STEPS.length} adımlı Mega Chain her fikri full-stack bir build planına çevirir.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/studio?new=1" className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              Boş projeyle başla <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/pricing" className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              Planları gör
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
