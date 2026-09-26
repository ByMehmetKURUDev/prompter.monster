import { ArrowRight, Check, Layers, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { EXPERTS, FORMATS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { pagesByCategory } from "@/lib/seo";
import { LegalLinks } from "@/components/site/LegalLinks";

const FREE = ["Günde 5 AI kredisi", "3 uzman persona", "Markdown + Claude XML", "Proje kütüphanesi"];
const PRO = ["Ayda 1.000 AI kredisi (Claude Sonnet 5)", "12 uzman + Mega Chain", "5 çıktı formatı + .cursorrules / CLAUDE.md", "Proje kütüphanesi ve versiyon geçmişi", "Paylaşılabilir prompt sayfası", "Öncelikli destek"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <a href="#how" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Nasıl çalışır
          </a>
          <Link href="/prompt" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Build prompt&apos;lar
          </Link>
          <Link href="/pricing" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Fiyat
          </Link>
          <Link href="/docs" className="hidden md:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Rehber
          </Link>
          <Link href="/studio" className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5">
            Studio&apos;yu aç <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-4 lg:px-8 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" /> Vibe-coder&apos;lar için build-spec fabrikası
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Fikrini anlat.
            <br />
            <span className="bg-gradient-to-r from-lime to-violet bg-clip-text text-transparent">Canavar, build prompt&apos;unu yazsın.</span>
          </h1>
          <p className="mt-6 text-[15px] md:text-[17px] text-zinc-400 max-w-[640px] mx-auto leading-relaxed">
            12 uzman persona (CTO, PM, Design, AI, Monetization, SEO…) proje fikrini Claude Code, Cursor, v0, Lovable ve Bolt&apos;a doğrudan
            yapıştırılacak, kopyala-çalıştır kalitesinde master build prompt&apos;lara çevirir. Mimari, özellik matrisi, ödeme akışı ve kısıtlar dahil.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/studio"
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-black tracking-wide flex items-center gap-2 shadow-[0_0_40px_rgba(163,255,18,0.35)] hover:shadow-[0_0_60px_rgba(163,255,18,0.55)] transition"
            >
              Ücretsiz başla — kayıt yok <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <a href="#how" className="h-12 px-6 rounded-xl bg-ink-800 border border-ink-600 text-[14px] font-medium flex items-center">
              2 dakikada nasıl çalışır
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-zinc-500">
            <span>24 proje tipi</span>
            <span>•</span>
            <span>12 uzman canavar</span>
            <span>•</span>
            <span>8 ödeme sistemi (Iyzico + PayTR dahil)</span>
            <span>•</span>
            <span>{FORMATS.length} çıktı formatı</span>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="max-w-[1100px] mx-auto px-4 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">4 adım, 1 mega prompt</h2>
        <div className="mt-10 grid md:grid-cols-4 gap-4">
          {[
            { n: "1", t: "Fikir & Vizyon", d: "Ad, pitch, hedef kitle, rakipler, USP. Claude ile 'Enhance'.", i: <Sparkles className="w-5 h-5 text-lime" /> },
            { n: "2", t: "Teknoloji & Mimari", d: "7 katmanda stack seçimi; proje tipine göre AI önerisi.", i: <Layers className="w-5 h-5 text-violet" /> },
            { n: "3", t: "Özellikler & Ödeme", d: "30+ özellik, 8 ödeme sağlayıcı, KVKK/GDPR uyumu.", i: <Check className="w-5 h-5 text-lime" /> },
            { n: "4", t: "Uzmanlar & Üret", d: "3-5 uzman seç, format seç, canavarı serbest bırak.", i: <Users className="w-5 h-5 text-violet" /> },
          ].map((x) => (
            <div key={x.n} className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center">{x.i}</div>
                <span className="text-[11px] font-mono text-zinc-600">0{x.n}</span>
              </div>
              <div className="mt-4 text-[14px] font-bold">{x.t}</div>
              <div className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Project types → programmatic SEO pages */}
      <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">Proje tipine göre başla</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">Her tip için önerilen uzmanlar, stack ve özellikler hazır. Tıkla, örnek prompt&apos;u gör, Studio o ayarlarla açılsın.</p>
        <div className="mt-8 space-y-6">
          {pagesByCategory().map((g) => (
            <div key={g.cat}>
              <div className="text-[11px] font-bold tracking-widest text-zinc-500">{g.cat}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.pages.map((p) => (
                  <Link key={p.slug} href={`/prompt/${p.slug}`} className="px-3 h-9 rounded-xl bg-ink-800 border border-ink-600 hover:border-lime/50 hover:text-lime text-[13px] flex items-center gap-1.5 transition">
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">12 uzman canavar</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">Her uzman kendi görev bloğunu, mimari notlarını ve başarı kriterlerini prompt&apos;a ekler.</p>
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
            <h3 className="mt-3 text-2xl font-bold tracking-tight">{MEGA_CHAIN_STEPS.length} adımda full-stack ürün</h3>
            <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">
              Tek bir prompt değil; her adımı bir öncekinin çıktısını kullanan bir zincir. PRD&apos;den lansman checklist&apos;ine kadar. .cursorrules ve
              CLAUDE.md olarak indir, deponun köküne koy, kodlamaya başla.
            </p>
            <Link href="/studio" className="mt-6 inline-flex h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold items-center gap-1.5">
              Zinciri üret <ArrowRight className="w-4 h-4" aria-hidden />
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">Basit fiyat</h2>
        <p className="mt-3 text-center text-[13px] text-zinc-500">Ücretsiz başla; ciddiye alınca Pro&apos;ya geç. Yıllıkta 2 ay bedava.</p>
        <div className="mt-10 grid md:grid-cols-2 gap-4 max-w-[820px] mx-auto">
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6">
            <div className="text-[12px] font-bold tracking-widest text-zinc-400">FREE</div>
            <div className="mt-3 text-4xl font-black">
              $0<span className="text-[13px] font-medium text-zinc-500">/ay</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              {FREE.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href="/studio" className="mt-8 h-10 rounded-lg bg-ink-950 border border-ink-400 text-[13px] font-semibold flex items-center justify-center">
              Ücretsiz başla
            </Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-ink-800 to-ink-700 border border-lime/40 p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime/20 blur-3xl rounded-full" />
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-widest text-lime">MONSTER PRO</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime text-black font-bold">POPÜLER</span>
            </div>
            <div className="mt-3 text-4xl font-black">
              $29<span className="text-[13px] font-medium text-zinc-500">/ay</span>
            </div>
            <div className="text-[12px] text-zinc-500">veya $290/yıl</div>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              {PRO.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-200">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="mt-8 w-full h-10 rounded-lg bg-white text-black text-[13px] font-bold flex items-center justify-center">
              Pro&apos;ya geç →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-6 text-[12px] text-zinc-600 flex flex-wrap items-center gap-3">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <span>•</span>
        <Link href="/docs" className="hover:text-zinc-300">
          Rehber
        </Link>
        <span>•</span>
        <Link href="/prompt" className="hover:text-zinc-300">
          Build prompt&apos;lar
        </Link>
        <span>•</span>
        <Link href="/pricing" className="hover:text-zinc-300">
          Fiyat
        </Link>
        <span>•</span>
        <LegalLinks />
        <Link href="/studio" className="ml-auto text-zinc-400 hover:text-white">
          Studio →
        </Link>
      </footer>
    </div>
  );
}
