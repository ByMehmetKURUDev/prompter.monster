import { ArrowRight, Check, Layers, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { EXPERTS, FORMATS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { lhref, type Locale } from "@/lib/i18n";
import { pagesByCategory } from "@/lib/seo";
import { DEFAULT_PUBLIC } from "@/lib/settings";
import { LanguageSwitch } from "./LanguageSwitch";
import { LegalLinks } from "./LegalLinks";

const D = DEFAULT_PUBLIC();

const COPY = {
  tr: {
    nav: { how: "Nasıl çalışır", prompts: "Build prompt'lar", pricing: "Fiyat", guide: "Rehber", studio: "Studio'yu aç" },
    badge: "Vibe-coder'lar için build-spec fabrikası",
    h1a: "Fikrini anlat.",
    h1b: "Canavar, build prompt'unu yazsın.",
    sub: "12 uzman persona (CTO, PM, Design, AI, Monetization, SEO…) proje fikrini Claude Code, Cursor, v0, Lovable ve Bolt'a doğrudan yapıştırılacak, kopyala-çalıştır kalitesinde master build prompt'lara çevirir. Mimari, özellik matrisi, ödeme akışı ve kısıtlar dahil.",
    cta: "Ücretsiz başla — kayıt yok",
    howCta: "2 dakikada nasıl çalışır",
    stats: ["24 proje tipi", "12 uzman canavar", "8 ödeme sistemi (Stripe, Iyzico, PayTR…)", `${FORMATS.length} çıktı formatı`],
    howTitle: "4 adım, 1 mega prompt",
    steps: [
      { t: "Fikir & Vizyon", d: "Ad, pitch, hedef kitle, rakipler, USP. Claude ile 'Enhance'." },
      { t: "Teknoloji & Mimari", d: "7 katmanda stack seçimi; proje tipine göre AI önerisi." },
      { t: "Özellikler & Ödeme", d: "30+ özellik, 8 ödeme sağlayıcı, KVKK/GDPR uyumu." },
      { t: "Uzmanlar & Üret", d: "3-5 uzman seç, format seç, canavarı serbest bırak." },
    ],
    typesTitle: "Proje tipine göre başla",
    typesSub: "Her tip için önerilen uzmanlar, stack ve özellikler hazır. Tıkla, örnek prompt'u gör, Studio o ayarlarla açılsın.",
    expertsTitle: "12 uzman canavar",
    expertsSub: "Her uzman kendi görev bloğunu, mimari notlarını ve başarı kriterlerini prompt'a ekler.",
    chainTitle: `${MEGA_CHAIN_STEPS.length} adımda full-stack ürün`,
    chainText: "Tek bir prompt değil; her adımı bir öncekinin çıktısını kullanan bir zincir. PRD'den lansman checklist'ine kadar. .cursorrules ve CLAUDE.md olarak indir, deponun köküne koy, kodlamaya başla.",
    chainCta: "Zinciri üret",
    priceTitle: "Basit fiyat",
    priceSub: "Ücretsiz başla; ciddiye alınca Pro'ya geç. Yıllıkta 2 ay bedava.",
    perMonth: "/ay",
    yearly: "veya $290/yıl",
    popular: "POPÜLER",
    free: [`Günde ${D.free_credits_per_day} AI kredisi`, "3 uzman persona", "Markdown + Claude XML", "Proje kütüphanesi"],
    pro: [`Ayda ${D.pro_credits_per_month.toLocaleString("tr-TR")} AI kredisi (Claude Sonnet 5)`, "12 uzman + Mega Chain", "5 çıktı formatı + .cursorrules / CLAUDE.md", "Proje kütüphanesi ve versiyon geçmişi", "Paylaşılabilir prompt sayfası", "Öncelikli destek"],
    freeCta: "Ücretsiz başla",
    proCta: "Pro'ya geç →",
  },
  en: {
    nav: { how: "How it works", prompts: "Build prompts", pricing: "Pricing", guide: "Guide", studio: "Open Studio" },
    badge: "The build-spec factory for vibe coders",
    h1a: "Describe your idea.",
    h1b: "The monster writes your build prompt.",
    sub: "12 expert personas (CTO, PM, Design, AI, Monetization, SEO…) turn your idea into copy-paste-ready master build prompts for Claude Code, Cursor, v0, Lovable and Bolt — architecture, feature matrix, payment flow and constraints included.",
    cta: "Start free — no sign-up",
    howCta: "See how it works in 2 minutes",
    stats: ["24 project types", "12 expert monsters", "8 payment providers (Stripe, Paddle, Lemon Squeezy…)", `${FORMATS.length} output formats`],
    howTitle: "4 steps, 1 mega prompt",
    steps: [
      { t: "Idea & vision", d: "Name, pitch, audience, competitors, USP. 'Enhance' it with Claude." },
      { t: "Tech & architecture", d: "Pick your stack across 7 layers; AI suggestions per project type." },
      { t: "Features & payments", d: "30+ features, 8 payment providers, GDPR/KVKK compliance." },
      { t: "Experts & generate", d: "Pick 3–5 experts and a format, then unleash the monster." },
    ],
    typesTitle: "Start from a project type",
    typesSub: "Recommended experts, stack and features are ready for every type. Click, see a sample prompt, and the Studio opens with those settings.",
    expertsTitle: "12 expert monsters",
    expertsSub: "Each expert adds its own task block, architecture notes and success criteria to the prompt.",
    chainTitle: `A full-stack product in ${MEGA_CHAIN_STEPS.length} steps`,
    chainText: "Not a single prompt — a chain where each step builds on the previous one, from PRD to launch checklist. Download it as .cursorrules or CLAUDE.md, drop it in your repo root and start coding.",
    chainCta: "Generate the chain",
    priceTitle: "Simple pricing",
    priceSub: "Start free; go Pro when you get serious. Yearly = 2 months free.",
    perMonth: "/mo",
    yearly: "or $290/year",
    popular: "POPULAR",
    free: [`${D.free_credits_per_day} AI credits a day`, "3 expert personas", "Markdown + Claude XML", "Project library"],
    pro: [`${D.pro_credits_per_month.toLocaleString("en-US")} AI credits a month (Claude Sonnet 5)`, "12 experts + Mega Chain", "5 output formats + .cursorrules / CLAUDE.md", "Project library and version history", "Shareable prompt pages", "Priority support"],
    freeCta: "Start free",
    proCta: "Go Pro →",
  },
} as const;

const STEP_ICONS = [
  <Sparkles key="1" className="w-5 h-5 text-lime" />,
  <Layers key="2" className="w-5 h-5 text-violet" />,
  <Check key="3" className="w-5 h-5 text-lime" />,
  <Users key="4" className="w-5 h-5 text-violet" />,
];

export function LandingView({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const L = (p: string) => lhref(p, locale);
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href={L("/")} className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px] max-[400px]:hidden">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <a href="#how" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {c.nav.how}
          </a>
          <Link href={L("/prompt")} className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {c.nav.prompts}
          </Link>
          <Link href={L("/pricing")} className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {c.nav.pricing}
          </Link>
          <Link href={L("/docs")} className="hidden md:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {c.nav.guide}
          </Link>
          <LanguageSwitch />
          <Link href={L("/studio")} className="h-9 px-3 sm:px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5 whitespace-nowrap">
            {c.nav.studio} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-4 lg:px-8 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" /> {c.badge}
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            {c.h1a}
            <br />
            <span className="bg-gradient-to-r from-lime to-violet bg-clip-text text-transparent">{c.h1b}</span>
          </h1>
          <p className="mt-6 text-[15px] md:text-[17px] text-zinc-400 max-w-[640px] mx-auto leading-relaxed">{c.sub}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={L("/studio")}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-black tracking-wide flex items-center gap-2 shadow-[0_0_40px_rgba(163,255,18,0.35)] hover:shadow-[0_0_60px_rgba(163,255,18,0.55)] transition"
            >
              {c.cta} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <a href="#how" className="h-12 px-6 rounded-xl bg-ink-800 border border-ink-600 text-[14px] font-medium flex items-center">
              {c.howCta}
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-zinc-500">
            {c.stats.map((s, i) => (
              <span key={s} className="flex items-center gap-6">
                {i > 0 && (
                  <span aria-hidden className="hidden sm:inline">
                    •
                  </span>
                )}
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="max-w-[1100px] mx-auto px-4 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">{c.howTitle}</h2>
        <div className="mt-10 grid md:grid-cols-4 gap-4">
          {c.steps.map((x, i) => (
            <div key={x.t} className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center">{STEP_ICONS[i]}</div>
                <span className="text-[11px] font-mono text-zinc-600">0{i + 1}</span>
              </div>
              <div className="mt-4 text-[14px] font-bold">{x.t}</div>
              <div className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Project types → programmatic SEO pages */}
      <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">{c.typesTitle}</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">{c.typesSub}</p>
        <div className="mt-8 space-y-6">
          {pagesByCategory(locale).map((g) => (
            <div key={g.cat}>
              <div className="text-[11px] font-bold tracking-widest text-zinc-500">{g.cat}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.pages.map((p) => (
                  <Link key={p.slug} href={L(`/prompt/${p.slug}`)} className="px-3 h-9 rounded-xl bg-ink-800 border border-ink-600 hover:border-lime/50 hover:text-lime text-[13px] flex items-center gap-1.5 transition">
                    {p.name} <ArrowRight className="w-3 h-3 opacity-50" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experts */}
      <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">{c.expertsTitle}</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">{c.expertsSub}</p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {EXPERTS.map((e) => (
            <div key={e.id} className="rounded-xl bg-ink-800 border border-ink-600 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-ink-950 border border-ink-600 grid place-items-center text-lg">{e.emoji}</div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{e.role}</div>
                <div className="text-[11px] text-zinc-500">
                  {e.org} • {e.years}y
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mega chain */}
      <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-ink-800 to-ink-700 border border-ink-400 p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-lime">
              <Zap className="w-3.5 h-3.5" /> MEGA CHAIN
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight">{c.chainTitle}</h3>
            <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{c.chainText}</p>
            <Link href={L("/studio")} className="mt-6 inline-flex h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold items-center gap-1.5">
              {c.chainCta} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <ol className="space-y-2">
            {MEGA_CHAIN_STEPS.map((st, i) => (
              <li key={st} className="flex items-center gap-3 rounded-xl bg-ink-950 border border-ink-600 px-3 py-2.5">
                <span className="w-7 h-7 rounded-full bg-ink-800 border border-ink-400 grid place-items-center text-[11px] font-bold shrink-0">{i + 1}</span>
                <span className="text-[13px]">{st}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-[1100px] mx-auto px-4 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">{c.priceTitle}</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">{c.priceSub}</p>
        <div className="mt-10 grid md:grid-cols-2 gap-4 max-w-[820px] mx-auto">
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6">
            <div className="text-[12px] font-bold tracking-widest text-zinc-400">FREE</div>
            <div className="mt-3 text-4xl font-black">
              $0<span className="text-[13px] font-medium text-zinc-500">{c.perMonth}</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              {c.free.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href={L("/studio")} className="mt-8 h-10 rounded-lg bg-ink-950 border border-ink-400 text-[13px] font-semibold flex items-center justify-center">
              {c.freeCta}
            </Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-ink-800 to-ink-700 border border-lime/40 p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime/20 blur-3xl rounded-full" />
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-widest text-lime">MONSTER PRO</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime text-black font-bold">{c.popular}</span>
            </div>
            <div className="mt-3 text-4xl font-black">
              $29<span className="text-[13px] font-medium text-zinc-500">{c.perMonth}</span>
            </div>
            <div className="text-[12px] text-zinc-500">{c.yearly}</div>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              {c.pro.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-200">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href={L("/pricing")} className="mt-8 w-full h-10 rounded-lg bg-white text-black text-[13px] font-bold flex items-center justify-center">
              {c.proCta}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-6 text-[12px] text-zinc-600 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <span aria-hidden>•</span>
        <Link href={L("/docs")} className="hover:text-zinc-300">
          {c.nav.guide}
        </Link>
        <span aria-hidden>•</span>
        <Link href={L("/prompt")} className="hover:text-zinc-300">
          {c.nav.prompts}
        </Link>
        <span aria-hidden>•</span>
        <Link href={L("/pricing")} className="hover:text-zinc-300">
          {c.nav.pricing}
        </Link>
        <span aria-hidden>•</span>
        <LegalLinks locale={locale} />
        <Link href={L("/studio")} className="ml-auto text-zinc-400 hover:text-white">
          Studio →
        </Link>
      </footer>
    </div>
  );
}
