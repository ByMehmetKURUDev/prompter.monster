import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import { ShareActions } from "@/components/share/ShareActions";
import { EXPERTS, PROJECT_CATEGORIES } from "@/lib/data";
import { loadCatalog } from "@/lib/catalog-server";
import { bumpViews, getShared } from "@/lib/share";
import { LegalLinks } from "@/components/site/LegalLinks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

function projectTypeOf(id: string) {
  for (const c of PROJECT_CATEGORIES) {
    const t = c.items.find((i) => i.id === id);
    if (t) return t;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [shared] = await Promise.all([getShared(slug), loadCatalog()]);
  if (!shared) return { title: "Paylaşım bulunamadı", robots: { index: false } };
  const type = projectTypeOf(shared.project_type);
  const title = `${shared.name || "Adsız canavar"} — master build prompt`;
  const description =
    (shared.pitch || shared.description || "").slice(0, 160) ||
    `${type?.name ?? "Proje"} için ${shared.experts.length} uzman canavarla üretilmiş build prompt. Kopyala, Claude Code / Cursor / v0'a yapıştır.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/p/${shared.slug}` },
    openGraph: { type: "article", title, description, url: `${SITE}/p/${shared.slug}`, siteName: "Prompt.Monster" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function SharedPromptPage({ params }: Props) {
  const { slug } = await params;
  const [shared] = await Promise.all([getShared(slug), loadCatalog()]);
  if (!shared) notFound();
  await bumpViews(shared.slug);

  const type = projectTypeOf(shared.project_type);
  const experts = shared.experts.map((id) => EXPERTS.find((e) => e.id === id)).filter(Boolean) as typeof EXPERTS;
  const date = new Date(shared.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const words = shared.output.split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="hidden sm:block text-zinc-500 text-[12px]">Paylaşılan prompt</span>
          <Link href="/studio?new=1" className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5">
            Kendi canavarını üret <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mb-4">
          {type && (
            <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-ink-800 border border-ink-600">
              <span aria-hidden>{type.icon}</span> {type.name}
            </span>
          )}
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{shared.format}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{shared.lang}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600 font-mono">v{shared.version}</span>
          <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-ink-800 border border-ink-600">
            <Eye className="w-3 h-3" aria-hidden /> {shared.views + 1}
          </span>
          <span className="text-zinc-600">{date}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{shared.name || "Adsız canavar"}</h1>
        {shared.pitch && <p className="mt-3 text-[15px] md:text-[17px] text-zinc-400 max-w-[720px] leading-relaxed">{shared.pitch}</p>}

        {experts.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {experts.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-2 px-3 h-8 rounded-xl bg-ink-800 border border-ink-600 text-[12px]">
                <span aria-hidden>{e.emoji}</span>
                <span className="font-semibold">{e.role}</span>
                <span className="text-zinc-500 hidden sm:inline">• {e.spec}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-8">
          <ShareActions slug={shared.slug} name={shared.name} output={shared.output} format={shared.format} />
        </div>

        <section className="mt-6 rounded-2xl bg-ink-900 border border-ink-600 overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-11 border-b border-ink-600 text-[11px] font-semibold tracking-widest text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden /> MASTER BUILD PROMPT
            <span className="ml-auto font-normal tracking-normal text-zinc-600">~{words.toLocaleString("tr-TR")} kelime</span>
          </div>
          <pre className="mono text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words p-4 md:p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
            {shared.output}
          </pre>
        </section>

        <section className="mt-10 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Bu prompt Prompt.Monster ile üretildi.</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">
            Kendi fikrini 4 adımda anlat; 18 uzman canavar (CTO, PM, Design, AI, SEO…) Claude Code, Cursor, v0, Lovable ve Bolt için
            kopyala-çalıştır kalitesinde build prompt&apos;unu yazsın. Kayıt gerektirmez.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/studio?new=1" className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              Ücretsiz dene <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href={`/studio?fork=${encodeURIComponent(shared.slug)}`} className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              Bu projeyi kendi Studio&apos;mda aç
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-4 text-[11px] text-zinc-600 flex flex-wrap gap-3">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <LegalLinks />
        <span className="ml-auto">Paylaşılan içerik, paylaşan kullanıcıya aittir.</span>
      </footer>
    </div>
  );
}
