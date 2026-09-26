import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Layers, ShieldCheck, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { ALL_PROJECT_TYPES, EXPERTS, FORMATS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { lhref, type Locale } from "@/lib/i18n";
import { SITE, categoryOf, expertsFor, pagesByCategory, paymentsFor, promptExcerpt, relatedPages, stackFor } from "@/lib/seo";
import { typePageBySlug, typePages } from "@/lib/seo-types";
import { PublicShell } from "./PublicShell";

const HUB = {
  tr: {
    title: "Proje tipine göre master build prompt'lar",
    description: (n: number) =>
      `${n} proje tipi için hazır build prompt şablonu: SaaS dashboard, AI wrapper, e-ticaret, marketplace, fintech, LMS, telemedicine ve daha fazlası. Claude Code, Cursor, v0, Lovable ve Bolt için.`,
    crumb: "Build prompt'lar",
    pill: (t: number, e: number, f: number) => `${t} proje tipi • ${e} uzman • ${f} format`,
    intro: "Her sayfa bir proje tipi için önerilen uzmanları, stack'i, özellik listesini ve kısaltılmış örnek prompt'u gösterir. Beğendiğin tipi seç; Studio o ayarlarla açılır, sen sadece fikrini yazarsın.",
    counts: (e: number, f: number) => `${e} uzman • ${f} özellik`,
    view: "Prompt'u incele",
    ctaTitle: "Listede olmayan bir fikrin mi var?",
    ctaText: (n: number) => `Studio boş projeyle de çalışır: tipini seç ya da seçme, ${n} adımlı Mega Chain her fikri full-stack bir build planına çevirir.`,
    ctaBlank: "Boş projeyle başla",
    ctaPlans: "Planları gör",
  },
  en: {
    title: "Master build prompts by project type",
    description: (n: number) =>
      `Ready-made build prompt templates for ${n} project types: SaaS dashboard, AI wrapper, e-commerce, marketplace, fintech, LMS, telemedicine and more. For Claude Code, Cursor, v0, Lovable and Bolt.`,
    crumb: "Build prompts",
    pill: (t: number, e: number, f: number) => `${t} project types • ${e} experts • ${f} formats`,
    intro: "Each page shows the recommended experts, stack, feature list and a shortened sample prompt for one project type. Pick a type and the Studio opens with those settings — you just write your idea.",
    counts: (e: number, f: number) => `${e} experts • ${f} features`,
    view: "See the prompt",
    ctaTitle: "Got an idea that isn't on the list?",
    ctaText: (n: number) => `The Studio works with a blank project too: pick a type or don't — the ${n}-step Mega Chain turns any idea into a full-stack build plan.`,
    ctaBlank: "Start a blank project",
    ctaPlans: "See plans",
  },
} as const;

export function hubMeta(locale: Locale) {
  const h = HUB[locale];
  return { title: h.title, description: h.description(typePages(locale).length) };
}

export function PromptHubView({ locale }: { locale: Locale }) {
  const h = HUB[locale];
  const pages = typePages(locale);
  const groups = pagesByCategory(locale);
  const L = (p: string) => lhref(p, locale);
  const base = locale === "en" ? `${SITE}/en` : SITE;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Prompt.Monster", item: base },
        { "@type": "ListItem", position: 2, name: h.crumb, item: `${base}/prompt` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: h.title,
      numberOfItems: pages.length,
      itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${base}/prompt/${p.slug}` })),
    },
  ];

  return (
    <PublicShell locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[1100px] mx-auto px-4 lg:px-8 py-12">
        <div className="text-center max-w-[720px] mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden /> {h.pill(pages.length, EXPERTS.length, FORMATS.length)}
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{h.title}</h1>
          <p className="mt-4 text-[14px] md:text-[16px] text-zinc-400 leading-relaxed">{h.intro}</p>
        </div>

        {groups.map((g) => (
          <section key={g.cat} className="mt-12">
            <h2 className="text-[12px] font-bold tracking-widest text-zinc-400">{g.cat}</h2>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.pages.map((p) => {
                const c = categoryOf(p.id);
                return (
                  <Link key={p.slug} href={L(`/prompt/${p.slug}`)} className="rounded-2xl bg-ink-800 border border-ink-600 hover:border-ink-400 p-5 transition group flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-600 grid place-items-center text-xl shrink-0" aria-hidden>
                        {c?.item.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold group-hover:text-lime transition truncate">{p.name}</h3>
                        <div className="text-[11px] text-zinc-500">{h.counts(p.experts.length, p.features.length)}</div>
                      </div>
                      {c?.item.badge && (
                        <span className="ml-auto text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-lime/15 text-lime border border-lime/30 shrink-0">{c.item.badge}</span>
                      )}
                    </div>
                    <p className="mt-3 text-[12px] text-zinc-500 leading-relaxed line-clamp-3 flex-1">{p.description}</p>
                    <span className="mt-4 text-[12px] text-zinc-400 group-hover:text-white flex items-center gap-1">
                      {h.view} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-16 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{h.ctaTitle}</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">{h.ctaText(MEGA_CHAIN_STEPS.length)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={L("/studio?new=1")} className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              {h.ctaBlank} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href={L("/pricing")} className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              {h.ctaPlans}
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

const TYPE = {
  tr: {
    generate: "Prompt üret",
    home: "Ana sayfa",
    crumb: "Build prompt'lar",
    experts: (n: number) => `${n} uzman`,
    features: (n: number) => `${n} özellik`,
    chainPill: (n: number) => `${n} adımlı Mega Chain`,
    forWho: "Kimler için:",
    generateNamed: (name: string) => `${name} prompt'u üret`,
    seeSample: "Örnek prompt'u gör",
    howTitle: "NASIL ÇALIŞIR",
    how: (name: string, n: number) => [
      `"${name}" tipini seç, adını ve fikrini bir cümleyle yaz.`,
      "Önerilen stack ve özellikleri onayla ya da değiştir.",
      `${n} uzman personayı seçili bul; istersen 18'e çıkar.`,
      "Formatı seç, üret, kopyala; Claude Code / Cursor / v0'a yapıştır.",
    ],
    expertsTitle: "Bu prompt'u yazan uzmanlar",
    expertsText: (name: string) => `Her uzman kendi görev bloğunu, kısıtlarını ve başarı kriterlerini prompt'a ekler. ${name} için varsayılan seçim:`,
    stackTitle: "Önerilen stack",
    stackText: "Studio'nun 2. adımında hazır gelir; 7 katmandan istediğini değiştir.",
    payTitle: "Ödeme & gelir modeli",
    compliance: "Uyum",
    featuresTitle: "Prompt'a giren özellikler",
    featuresText: 'Her özellik prompt\'ta "Spec + API + UI + Test" satırı olarak yer alır.',
    sampleTitle: "Örnek prompt (kısaltılmış)",
    sampleText: (pitch: string, e: number, s: number) => [`Örnek fikir: `, `"${pitch}"`, `. Aşağıda master prompt'un başlığı ve ilk uzmanın bloğu var; Studio tam metni ${e} uzman × ${s} adım olarak üretir.`],
    lang: "TR",
    truncated: "Devamı Studio'da: tüm uzman blokları, özellik matrisi ve Mega Chain.",
    full: "Tam metin Studio'da üretilir.",
    fullCta: "Tam prompt'u üret",
    chainTitle: (n: number, name: string) => `Mega Chain: ${n} adımda full-stack ${name}`,
    faqTitle: "Sık sorulanlar",
    relatedTitle: "Benzer proje tipleri",
    allTypes: "Tüm proje tipleri",
    ctaTitle: (name: string) => `${name} fikrini 4 adımda master prompt'a çevir.`,
    ctaText: "Uzmanlar, stack ve özellikler bu sayfadaki gibi hazır gelir; sen adını ve fikrini yaz. Ücretsiz, kart gerekmez.",
    ctaFree: "Ücretsiz üret",
    ctaPro: "Pro ile 18 uzman + Mega Chain",
    faq: [
      {
        q: "Üretilen prompt'u hangi araçlara yapıştırabilirim?",
        a: "Claude Code, Cursor, Windsurf, v0, Lovable, Bolt ve ChatGPT. Çıktı formatını (Claude XML, ChatGPT Markdown, Cursor Rules, v0, Lovable/Bolt) Studio'nun 4. adımında seçersin; .cursorrules ve CLAUDE.md olarak da indirebilirsin.",
      },
      {
        q: "Ücretsiz mi?",
        a: "Evet. Free planda 3 uzman ve 2 format ile sınırsız prompt üretirsin; kart gerekmez. 18 uzman, Mega Chain ve Export to Builders Monster Pro'da ($29/ay).",
      },
    ],
    notFound: "Sayfa bulunamadı",
  },
  en: {
    generate: "Generate prompt",
    home: "Home",
    crumb: "Build prompts",
    experts: (n: number) => `${n} experts`,
    features: (n: number) => `${n} features`,
    chainPill: (n: number) => `${n}-step Mega Chain`,
    forWho: "Built for:",
    generateNamed: (name: string) => `Generate a ${name} prompt`,
    seeSample: "See the sample prompt",
    howTitle: "HOW IT WORKS",
    how: (name: string, n: number) => [
      `Pick the "${name}" type and describe your idea in one sentence.`,
      "Confirm or tweak the suggested stack and features.",
      `${n} expert personas come preselected — go up to 18 if you like.`,
      "Pick a format, generate, copy and paste into Claude Code / Cursor / v0.",
    ],
    expertsTitle: "The experts who write this prompt",
    expertsText: (name: string) => `Each expert adds its own task block, constraints and success criteria to the prompt. Default selection for ${name}:`,
    stackTitle: "Recommended stack",
    stackText: "Preloaded in step 2 of the Studio; change any of the 7 layers.",
    payTitle: "Payments & revenue model",
    compliance: "Compliance",
    featuresTitle: "Features in the prompt",
    featuresText: 'Every feature appears in the prompt as a "Spec + API + UI + Tests" line.',
    sampleTitle: "Sample prompt (shortened)",
    sampleText: (pitch: string, e: number, s: number) => [`Sample idea: `, `"${pitch}"`, `. Below are the master prompt's header and the first expert's block; the Studio generates the full text as ${e} experts × ${s} steps.`],
    lang: "EN",
    truncated: "The rest is in the Studio: every expert block, the feature matrix and the Mega Chain.",
    full: "The full text is generated in the Studio.",
    fullCta: "Generate the full prompt",
    chainTitle: (n: number, name: string) => `Mega Chain: a full-stack ${name} in ${n} steps`,
    faqTitle: "FAQ",
    relatedTitle: "Similar project types",
    allTypes: "All project types",
    ctaTitle: (name: string) => `Turn your ${name} idea into a master prompt in 4 steps.`,
    ctaText: "Experts, stack and features come preloaded like on this page — you add the name and the idea. Free, no card required.",
    ctaFree: "Generate for free",
    ctaPro: "Pro: 18 experts + Mega Chain",
    faq: [
      {
        q: "Which tools can I paste the generated prompt into?",
        a: "Claude Code, Cursor, Windsurf, v0, Lovable, Bolt and ChatGPT. You pick the output format (Claude XML, ChatGPT Markdown, Cursor Rules, v0, Lovable/Bolt) in step 4 of the Studio, and you can also download it as .cursorrules or CLAUDE.md.",
      },
      {
        q: "Is it free?",
        a: "Yes. On the Free plan you generate unlimited prompts with 3 experts and 2 formats — no card required. 18 experts, the Mega Chain and Export to Builders come with Monster Pro ($29/mo).",
      },
    ],
    notFound: "Page not found",
  },
} as const;

export function typePageMeta(slug: string, locale: Locale) {
  const page = typePageBySlug(slug, locale);
  if (!page) return null;
  return { page, url: `${locale === "en" ? `${SITE}/en` : SITE}/prompt/${page.slug}`, notFound: TYPE[locale].notFound };
}

export function TypePageView({ slug, locale }: { slug: string; locale: Locale }) {
  const page = typePageBySlug(slug, locale);
  // Types hidden in /admin/catalog are gone from ALL_PROJECT_TYPES (catalog applied by the route).
  if (!page || !ALL_PROJECT_TYPES.some((t) => t.id === page.id)) notFound();
  const t = TYPE[locale];
  const L = (p: string) => lhref(p, locale);
  const category = categoryOf(page.id);
  const experts = expertsFor(page);
  const payments = paymentsFor(page);
  const stack = stackFor(page.id);
  const excerpt = promptExcerpt(page, 2600, locale);
  const related = relatedPages(page, 6, locale);
  const faq = [...page.faq, ...t.faq];
  const base = locale === "en" ? `${SITE}/en` : SITE;
  const url = `${base}/prompt/${page.slug}`;
  const studioHref = L(`/studio?type=${encodeURIComponent(page.id)}`);
  const [before, quote, after] = t.sampleText(page.samplePitch, experts.length, MEGA_CHAIN_STEPS.length);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Prompt.Monster", item: base },
        { "@type": "ListItem", position: 2, name: t.crumb, item: `${base}/prompt` },
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
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: "Prompt.Monster", url: SITE },
      about: { "@type": "Thing", name: page.name },
    },
  ];

  return (
    <PublicShell locale={locale} cta={{ href: studioHref, label: t.generate }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500">
          <Link href={L("/")} className="hover:text-zinc-300">
            {t.home}
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <Link href={L("/prompt")} className="hover:text-zinc-300">
            {t.crumb}
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
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{t.experts(experts.length)}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{t.features(page.features.length)}</span>
          <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-ink-800 border border-ink-600">{t.chainPill(MEGA_CHAIN_STEPS.length)}</span>
        </div>

        <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{page.title}</h1>
        <p className="mt-4 text-[15px] md:text-[17px] text-zinc-400 max-w-[760px] leading-relaxed">{page.description}</p>
        <p className="mt-2 text-[13px] text-zinc-500">
          {t.forWho} <span className="text-zinc-300">{page.audience}</span>
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={studioHref} className="h-12 px-6 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2 shadow-[0_0_30px_rgba(163,255,18,0.25)]">
            {t.generateNamed(page.name)} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <a href="#ornek" className="h-12 px-6 rounded-xl bg-ink-800 border border-ink-600 text-[14px] font-medium flex items-center">
            {t.seeSample}
          </a>
        </div>

        <section className="mt-12 grid md:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="space-y-4 text-[14px] md:text-[15px] text-zinc-300 leading-relaxed">
            <p>{page.intro[0]}</p>
            <p>{page.intro[1]}</p>
          </div>
          <aside className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
            <div className="text-[11px] font-bold tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-lime" aria-hidden /> {t.howTitle}
            </div>
            <ol className="mt-3 space-y-2 text-[13px] text-zinc-300">
              {t.how(page.name, experts.length).map((x, i) => (
                <li key={x} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-ink-950 border border-ink-600 grid place-items-center text-[10px] font-mono text-zinc-500 shrink-0">{i + 1}</span>
                  <span>{x}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-violet" aria-hidden /> {t.expertsTitle}
          </h2>
          <p className="mt-2 text-[13px] text-zinc-500">{t.expertsText(page.name)}</p>
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
                  <p className="mt-2 text-[12px] text-zinc-400 leading-relaxed line-clamp-3">{locale === "en" ? (e.taskEn ?? e.task) : e.task}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
            <h2 className="text-[15px] font-bold tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime" aria-hidden /> {t.stackTitle}
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500">{t.stackText}</p>
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
                  <Wallet className="w-4 h-4 text-violet" aria-hidden /> {t.payTitle}
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
                  <ShieldCheck className="w-4 h-4 text-lime" aria-hidden /> {t.compliance}
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
              <Check className="w-4 h-4 text-lime" aria-hidden /> {t.featuresTitle}
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500">{t.featuresText}</p>
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

        <section id="ornek" className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lime" aria-hidden /> {t.sampleTitle}
          </h2>
          <p className="mt-2 text-[13px] text-zinc-500 max-w-[720px]">
            {before}
            <em className="text-zinc-300 not-italic">{quote}</em>
            {after}
          </p>
          <div className="mt-5 rounded-2xl bg-ink-900 border border-ink-600 overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-11 border-b border-ink-600 text-[11px] font-semibold tracking-widest text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden /> {page.name.toUpperCase()} — MASTER BUILD PROMPT
              <span className="ml-auto font-normal tracking-normal text-zinc-600">Claude XML • {t.lang}</span>
            </div>
            <pre className="mono text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words p-4 md:p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">{excerpt.text}</pre>
            <div className="border-t border-ink-600 px-4 py-3 flex flex-wrap items-center gap-3 text-[12px] text-zinc-500">
              <span>{excerpt.truncated ? t.truncated : t.full}</span>
              <Link href={studioHref} className="ml-auto text-lime font-semibold flex items-center gap-1">
                {t.fullCta} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-ink-800 border border-ink-600 p-5">
            <h3 className="text-[13px] font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet" aria-hidden /> {t.chainTitle(MEGA_CHAIN_STEPS.length, page.name)}
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

        <section className="mt-14">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.faqTitle}</h2>
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

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.relatedTitle}</h2>
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => {
                const c = categoryOf(r.id);
                return (
                  <Link key={r.slug} href={L(`/prompt/${r.slug}`)} className="rounded-2xl bg-ink-800 border border-ink-600 hover:border-ink-400 p-4 transition group">
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
            <Link href={L("/prompt")} className="mt-4 inline-flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white">
              {t.allTypes} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </section>
        )}

        <section className="mt-14 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t.ctaTitle(page.name)}</h2>
          <p className="mt-2 text-[14px] text-zinc-400 max-w-[640px] leading-relaxed">{t.ctaText}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={studioHref} className="h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px] flex items-center gap-2">
              {t.ctaFree} <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href={L("/pricing")} className="h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[14px] flex items-center">
              {t.ctaPro}
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
