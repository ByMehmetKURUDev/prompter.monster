import { cookies } from "next/headers";
import Link from "next/link";
import { BadgePercent, Check, Minus } from "lucide-react";
import { ProCta } from "@/components/billing/ProCta";
import { ATTR_CODE_COOKIE, sanitizeCode } from "@/lib/attribution";
import { lhref, type Locale } from "@/lib/i18n";
import { readServerSettings } from "@/lib/settings-server";
import { PublicShell } from "./PublicShell";

/** Friendly model names for the plan cards (falls back to the raw id). */
export function modelLabel(id: string): string {
  const m: Record<string, string> = {
    "claude-sonnet-5": "Claude Sonnet 5",
    "claude-haiku-4-5": "Claude Haiku 4.5",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
    "claude-opus-5-5": "Claude Opus 5.5",
    "claude-fable-5-1": "Claude Fable 5.1",
  };
  return m[id] ?? id;
}

const fmt = (n: number, locale: Locale) => n.toLocaleString(locale === "en" ? "en-US" : "tr-TR");

type Cell = string | boolean;

function CellView({ v, locale }: { v: Cell; locale: Locale }) {
  if (v === true) return <Check className="w-4 h-4 text-lime" aria-label={locale === "en" ? "included" : "var"} />;
  if (v === false) return <Minus className="w-4 h-4 text-zinc-600" aria-label={locale === "en" ? "not included" : "yok"} />;
  return <span>{v}</span>;
}

export async function PricingView({ locale }: { locale: Locale }) {
  const s = await readServerSettings();
  const jar = await cookies();
  const code = sanitizeCode(jar.get(ATTR_CODE_COOKIE)?.value) || sanitizeCode(String(s.launch_coupon || ""));
  const couponText = String(s.launch_coupon_text || "");
  const n = (k: string) => Number(s[k]);
  const free = n("free_credits_per_day");
  const anon = n("anon_credits_per_day");
  const month = n("pro_credits_per_month");
  const proDay = n("pro_credits_per_day");
  const cost = { enhance: n("credit_cost_enhance"), suggest: n("credit_cost_suggest"), refine: n("credit_cost_refine") };
  const proModel = modelLabel(String(s.ai_model_pro || "claude-sonnet-5"));
  const freeModel = modelLabel(String(s.ai_model_free || "claude-haiku-4-5"));
  const refinesPerMonth = Math.floor(month / Math.max(1, cost.refine));
  const tr = locale === "tr";

  const c = tr
    ? {
        badge: "Ücretsiz başla, kart gerekmez",
        h1: "Basit fiyat, canavar güç",
        sub: "Free ile fikrini build prompt'a çevir; ciddiye alınca Pro ile 18 uzmanı, Mega Chain'i ve aylık AI kredisini serbest bırak. Yıllıkta 2 ay bedava.",
        perMonth: "/ay",
        freeFor: "Denemeler ve yan projeler için.",
        freeList: [`Günde ${fmt(free, locale)} AI kredisi (${freeModel})`, "3 uzman persona", "Markdown + Claude XML", "Proje kütüphanesi ve versiyonlar", "Paylaşım sayfası"],
        freeCta: "Ücretsiz başla",
        proBadge: "EN İYİ DEĞER",
        yearly: "veya $290/yıl (2 ay bedava)",
        proList: [`Ayda ${fmt(month, locale)} AI kredisi (${proModel})`, "18 uzman + 8 adımlı Mega Chain", "5 çıktı formatı + .cursorrules / CLAUDE.md", "Export to Builders", "Öncelikli destek"],
        secure: "Güvenli ödeme: Lemon Squeezy (Merchant of Record, KDV dahil fatura)",
        refund: "14 gün koşulsuz iade",
        coupon: (k: string) => `${k} kodu ödeme sayfasında otomatik uygulanır`,
        creditsTitle: "Krediler nasıl çalışır?",
        creditsIntro: "Prompt üretimi (şablon motoru) her planda sınırsız ve ücretsizdir. Kredi yalnızca Claude'a giden düğmelerde harcanır:",
        actions: [
          ["Açıklamayı güçlendir (Enhance)", cost.enhance],
          ["AI ile stack öner", cost.suggest],
          ["Promptu iyileştir (uzman başına)", cost.refine],
        ] as [string, number][],
        creditsNote: `Pro'da ${fmt(month, locale)} kredi ≈ ${fmt(refinesPerMonth, locale)} iyileştirme. Günlük adil kullanım sınırı ${fmt(proDay, locale)} kredi. Başarısız çağrıların kredisi otomatik iade edilir; krediler ay sonunda sıfırlanır (devretmez). Hesap açmadan günde ${fmt(anon, locale)} kredi.`,
        credit: "kredi",
        compare: "Karşılaştırma",
        feature: "ÖZELLİK",
        rows: [
          ["Studio (4 adımlı sihirbaz, 28 proje tipi, 15+ şablon)", true, true],
          ["Prompt üretimi (şablon motoru)", "sınırsız", "sınırsız"],
          ["AI kredisi", `günde ${fmt(free, locale)}`, `ayda ${fmt(month, locale)} (günde ≤ ${fmt(proDay, locale)})`],
          ["AI modeli", freeModel, proModel],
          ["Uzman canavar", "3 uzman", "18 uzman + Mega Chain"],
          ["Çıktı formatı", "ChatGPT Markdown, Claude XML", "5 format + .cursorrules / CLAUDE.md"],
          ["Proje kütüphanesi ve versiyon geçmişi", true, true],
          ["Paylaşılabilir prompt sayfası (/p/…)", true, true],
          ["Export to Builders (Cursor, v0, Lovable, Bolt)", false, true],
          ["Öncelikli destek", false, true],
        ] as [string, Cell, Cell][],
        faqTitle: "Sık sorulanlar",
        faq: [
          ["Kart bilgisi istiyor musunuz?", "Hayır. Free plan için kayıt bile gerekmez; hesap yalnızca kaydetme, versiyon ve paylaşım için."],
          ["Kredim biterse ne olur?", `Prompt üretmeye devam edersin — yalnızca AI düğmeleri beklemeye geçer. Free krediler her gün, Pro kredileri her ay yenilenir.`],
          ["İptal edebilir miyim?", "Evet, istediğin an. Dönem sonuna kadar Pro devam eder, sonra Free'ye geçersin; projelerin silinmez."],
          ["İade var mı?", "İlk satın alımda 14 gün içinde koşulsuz tam iade. Ayrıntılar İade Politikası'nda."],
          ["Fatura ve KDV?", "Ödemeyi Lemon Squeezy satıcı kaydı (Merchant of Record) olarak alır; KDV dahil faturan otomatik e-postana gelir."],
          ["Kodum/kuponum var, nasıl kullanırım?", "Kod içeren bağlantıyla geldiysen kod otomatik uygulanır; değilse ödeme sayfasında 'Add discount' alanına yazabilirsin."],
        ] as [string, string][],
      }
    : {
        badge: "Start free, no card required",
        h1: "Simple pricing, monster power",
        sub: "Turn your idea into a build prompt on Free; when you get serious, Pro unlocks all 18 experts, the Mega Chain and a monthly AI credit allowance. Yearly = 2 months free.",
        perMonth: "/mo",
        freeFor: "For experiments and side projects.",
        freeList: [`${fmt(free, locale)} AI credits a day (${freeModel})`, "3 expert personas", "Markdown + Claude XML", "Project library and versions", "Share pages"],
        freeCta: "Start free",
        proBadge: "BEST VALUE",
        yearly: "or $290/year (2 months free)",
        proList: [`${fmt(month, locale)} AI credits a month (${proModel})`, "18 experts + 8-step Mega Chain", "5 output formats + .cursorrules / CLAUDE.md", "Export to Builders", "Priority support"],
        secure: "Secure checkout: Lemon Squeezy (merchant of record, VAT invoice)",
        refund: "14-day no-questions-asked refund",
        coupon: (k: string) => `Code ${k} is applied automatically at checkout`,
        creditsTitle: "How credits work",
        creditsIntro: "Prompt generation (the template engine) is unlimited and free on every plan. Credits are only spent on buttons that call Claude:",
        actions: [
          ["Enhance the description", cost.enhance],
          ["Suggest a stack with AI", cost.suggest],
          ["Refine a prompt (per expert)", cost.refine],
        ] as [string, number][],
        creditsNote: `On Pro, ${fmt(month, locale)} credits ≈ ${fmt(refinesPerMonth, locale)} refines. Daily fair-use cap: ${fmt(proDay, locale)} credits. Failed calls are refunded automatically; credits reset at the end of the month (no rollover). Without an account: ${fmt(anon, locale)} credits a day.`,
        credit: "credits",
        compare: "Compare plans",
        feature: "FEATURE",
        rows: [
          ["Studio (4-step wizard, 28 project types, 15+ templates)", true, true],
          ["Prompt generation (template engine)", "unlimited", "unlimited"],
          ["AI credits", `${fmt(free, locale)} a day`, `${fmt(month, locale)} a month (≤ ${fmt(proDay, locale)}/day)`],
          ["AI model", freeModel, proModel],
          ["Expert monsters", "3 experts", "18 experts + Mega Chain"],
          ["Output formats", "ChatGPT Markdown, Claude XML", "5 formats + .cursorrules / CLAUDE.md"],
          ["Project library and version history", true, true],
          ["Shareable prompt pages (/p/…)", true, true],
          ["Export to Builders (Cursor, v0, Lovable, Bolt)", false, true],
          ["Priority support", false, true],
        ] as [string, Cell, Cell][],
        faqTitle: "FAQ",
        faq: [
          ["Do you need my card?", "No. Free doesn't even need an account; an account is only for saving, versions and sharing."],
          ["What happens when I run out of credits?", "You keep generating prompts — only the AI buttons pause. Free credits renew daily, Pro credits monthly."],
          ["Can I cancel?", "Anytime. Pro stays active until the end of the period, then you move to Free; your projects are kept."],
          ["Is there a refund?", "Yes: a full refund within 14 days of your first purchase, no questions asked. See the Refund Policy."],
          ["Invoices and VAT?", "Lemon Squeezy collects the payment as merchant of record and emails you a VAT invoice automatically."],
          ["I have a discount code — how do I use it?", "If you came through a link with the code it's applied automatically; otherwise enter it under 'Add discount' at checkout."],
        ] as [string, string][],
      };

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" /> {c.badge}
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">{c.h1}</h1>
          <p className="mt-4 text-[14px] md:text-[16px] text-zinc-400 max-w-[600px] mx-auto leading-relaxed">{c.sub}</p>
        </div>

        {code && (
          <div className="mt-8 max-w-[820px] mx-auto rounded-2xl border border-lime/30 bg-lime/10 px-4 py-3 text-[13px] text-lime flex items-center gap-2 justify-center text-center">
            <BadgePercent className="w-4 h-4 shrink-0" aria-hidden /> {c.coupon(code)}
            {couponText && <span className="text-lime/80">— {couponText}</span>}
          </div>
        )}

        <div className="mt-10 grid md:grid-cols-2 gap-4 max-w-[820px] mx-auto">
          <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6 flex flex-col">
            <div className="text-[12px] font-bold tracking-widest text-zinc-400">FREE</div>
            <div className="mt-3 text-4xl font-black">
              $0<span className="text-[13px] font-medium text-zinc-500">{c.perMonth}</span>
            </div>
            <p className="mt-2 text-[13px] text-zinc-500">{c.freeFor}</p>
            <ul className="mt-6 space-y-2.5 text-[13px] flex-1">
              {c.freeList.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Link href={lhref("/studio", locale)} className="mt-8 h-11 rounded-xl bg-ink-950 border border-ink-400 text-[13px] font-semibold flex items-center justify-center">
              {c.freeCta}
            </Link>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-ink-800 to-ink-700 border border-lime/40 p-6 relative overflow-hidden flex flex-col">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime/20 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-bold tracking-widest text-lime">MONSTER PRO</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime text-black font-bold">{c.proBadge}</span>
            </div>
            <div className="mt-3 text-4xl font-black">
              $29<span className="text-[13px] font-medium text-zinc-500">{c.perMonth}</span>
            </div>
            <div className="text-[12px] text-zinc-500">{c.yearly}</div>
            <ul className="mt-6 space-y-2.5 text-[13px] flex-1">
              {c.proList.map((f) => (
                <li key={f} className="flex items-center gap-2 text-zinc-200">
                  <Check className="w-4 h-4 text-lime shrink-0" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ProCta className="w-full" code={code} next={lhref("/pricing", locale)} />
              <p className="mt-3 text-center text-[11px] text-zinc-500 leading-relaxed">
                {c.secure} •{" "}
                <Link href={lhref("/legal/refund", locale)} className="underline hover:text-zinc-300">
                  {c.refund}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <section className="mt-16 max-w-[820px] mx-auto rounded-2xl bg-ink-900 border border-ink-600 p-6">
          <h2 className="text-xl font-bold tracking-tight">{c.creditsTitle}</h2>
          <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed">{c.creditsIntro}</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {c.actions.map(([label, n]) => (
              <div key={label} className="rounded-xl bg-ink-800 border border-ink-600 p-4">
                <div className="text-2xl font-black text-lime tabular-nums">{n}</div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{c.credit}</div>
                <div className="mt-2 text-[13px] text-zinc-300">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] text-zinc-500 leading-relaxed">{c.creditsNote}</p>
        </section>

        <section className="mt-16 max-w-[820px] mx-auto">
          <h2 className="text-xl font-bold tracking-tight">{c.compare}</h2>
          <div className="mt-4 rounded-2xl border border-ink-600 overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead className="bg-ink-800 text-[11px] tracking-widest text-zinc-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">{c.feature}</th>
                  <th className="text-left font-semibold px-4 py-3 w-[26%]">FREE</th>
                  <th className="text-left font-semibold px-4 py-3 w-[32%] text-lime">PRO</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map(([label, f, p]) => (
                  <tr key={label} className="border-t border-ink-600">
                    <td className="px-4 py-3 text-zinc-300">{label}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <CellView v={f} locale={locale} />
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      <CellView v={p} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 max-w-[820px] mx-auto">
          <h2 className="text-xl font-bold tracking-tight">{c.faqTitle}</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-[13px]">
            {c.faq.map(([q, a]) => (
              <div key={q} className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
                <div className="font-semibold">{q}</div>
                <p className="mt-2 text-zinc-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
