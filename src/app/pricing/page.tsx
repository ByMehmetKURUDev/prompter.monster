import type { Metadata } from "next";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { ProCta } from "@/components/billing/ProCta";
import { LegalLinks } from "@/components/site/LegalLinks";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "Prompt.Monster ücretsiz başlar: günde 3 AI çağrısı, 3 uzman, proje kütüphanesi. Monster Pro $29/ay: 12 uzman, Mega Chain, sınırsız iyileştirme, paylaşım sayfaları.",
  alternates: { canonical: "https://prompter.monster/pricing" },
  openGraph: { title: "Prompt.Monster fiyatlandırma", description: "Ücretsiz başla, ciddiye alınca Pro'ya geç. $29/ay veya $290/yıl.", url: "https://prompter.monster/pricing" },
};

type Row = { label: string; free: string | boolean; pro: string | boolean };

const ROWS: Row[] = [
  { label: "Studio (4 adımlı sihirbaz, 24 proje tipi, 15+ şablon)", free: true, pro: true },
  { label: "Uzman canavar", free: "3 uzman", pro: "12 uzman + Mega Chain" },
  { label: "Çıktı formatı", free: "ChatGPT Markdown, Claude XML", pro: "5 format + .cursorrules / CLAUDE.md" },
  { label: "Claude ile AI güçlendirme, stack önerisi, iyileştirme", free: "günde 3", pro: "günde 200 (adil kullanım)" },
  { label: "Proje kütüphanesi ve versiyon geçmişi", free: true, pro: true },
  { label: "Paylaşılabilir prompt sayfası (/p/…)", free: true, pro: true },
  { label: "Export to Builders (Cursor, v0, Lovable, Bolt)", free: false, pro: true },
  { label: "Öncelikli destek", free: false, pro: true },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="w-4 h-4 text-lime" aria-label="var" />;
  if (v === false) return <Minus className="w-4 h-4 text-zinc-600" aria-label="yok" />;
  return <span>{v}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <Link href="/studio" className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5">
            Studio&apos;yu aç <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" /> Ücretsiz başla, kart gerekmez
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">Basit fiyat, canavar güç</h1>
          <p className="mt-4 text-[14px] md:text-[16px] text-zinc-400 max-w-[560px] mx-auto leading-relaxed">
            Free ile fikrini build prompt&apos;a çevir; ciddiye alınca Pro ile 12 uzmanı ve Mega Chain&apos;i serbest bırak. Yıllıkta 2 ay bedava.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-4 max-w-[820px] mx-auto">
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6 flex flex-col">
            <div className="text-[12px] font-bold tracking-widest text-zinc-400">FREE</div>
            <div className="mt-3 text-4xl font-black">
              $0<span className="text-[13px] font-medium text-zinc-500">/ay</span>
            </div>
            <p className="mt-2 text-[13px] text-zinc-500">Tek kişilik denemeler ve yan projeler için.</p>
            <ul className="mt-6 space-y-2.5 text-[13px] flex-1">
              {["Günde 3 AI çağrısı", "3 uzman persona", "Markdown + Claude XML", "Proje kütüphanesi ve versiyonlar", "Paylaşım sayfası"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href="/studio" className="mt-8 h-11 rounded-xl bg-ink-950 border border-ink-400 text-[13px] font-semibold flex items-center justify-center">
              Ücretsiz başla
            </Link>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-ink-800 to-ink-700 border border-lime/40 p-6 relative overflow-hidden flex flex-col">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-widest text-lime">MONSTER PRO</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime text-black font-bold">LANSMANDA</span>
            </div>
            <div className="mt-3 text-4xl font-black">
              $29<span className="text-[13px] font-medium text-zinc-500">/ay</span>
            </div>
            <div className="text-[12px] text-zinc-500">veya $290/yıl (2 ay bedava) • Türkiye için TL fiyat ve Iyzico yakında</div>
            <ul className="mt-6 space-y-2.5 text-[13px] flex-1">
              {["Günde 200 AI çağrısı (adil kullanım)", "12 uzman + 8 adımlı Mega Chain", "5 çıktı formatı + .cursorrules / CLAUDE.md", "Export to Builders", "Öncelikli destek"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-200">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ProCta className="w-full" />
              <p className="mt-3 text-center text-[11px] text-zinc-500 leading-relaxed">
                Güvenli ödeme: Lemon Squeezy (Merchant of Record, KDV dahil fatura) •{" "}
                <Link href="/legal/refund" className="underline hover:text-zinc-300">
                  14 gün koşulsuz iade
                </Link>
              </p>
            </div>
          </div>
        </div>

        <section className="mt-16 max-w-[820px] mx-auto">
          <h2 className="text-xl font-bold tracking-tight">Karşılaştırma</h2>
          <div className="mt-4 rounded-2xl border border-ink-600 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-ink-800 text-[11px] tracking-widest text-zinc-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">ÖZELLİK</th>
                  <th className="text-left font-semibold px-4 py-3 w-[26%]">FREE</th>
                  <th className="text-left font-semibold px-4 py-3 w-[30%] text-lime">PRO</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label} className="border-t border-ink-600">
                    <td className="px-4 py-3 text-zinc-300">{r.label}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <Cell v={r.free} />
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      <Cell v={r.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 max-w-[820px] mx-auto grid md:grid-cols-2 gap-6 text-[13px]">
          {[
            ["Kart bilgisi istiyor musunuz?", "Hayır. Free plan için kayıt bile gerekmez; hesap yalnızca kaydetme, versiyon ve paylaşım için."],
            ["AI çağrısı ne demek?", "Açıklamayı güçlendir, stack öner ve promptu iyileştir düğmeleri Claude'a gider; her biri bir çağrıdır. Şablon üretimi sınırsızdır."],
            ["Pro ne zaman açılıyor?", "Lansmanla birlikte. Haber ver'e basarsan hesabına not düşülür; açıldığında ilk sen öğrenirsin ve lansman fiyatından yararlanırsın."],
            ["İptal edebilir miyim?", "Evet, istediğin an. Dönem sonuna kadar Pro devam eder, sonra Free'ye düşersin; projelerin silinmez."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
              <div className="font-semibold">{q}</div>
              <p className="mt-2 text-zinc-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-6 text-[12px] text-zinc-600 flex flex-wrap items-center gap-3">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <span>•</span>
        <LegalLinks />
        <Link href="/studio" className="ml-auto text-zinc-400 hover:text-white">
          Studio →
        </Link>
      </footer>
    </div>
  );
}
