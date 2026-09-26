import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";
import { getLegalDoc, isLegalSlug, legalInfo, LEGAL_LABELS, LEGAL_SLUGS, LEGAL_UPDATED, type Block, type LegalSlug } from "@/lib/legal";
import { mergeSettings, publicSubset } from "@/lib/settings";
import { readPublicSettings } from "@/lib/settings-server";
import { cx } from "@/lib/cx";
import { CookiePrefsButton } from "./CookiePrefsButton";
import { PublicShell } from "./PublicShell";
import { RichText } from "./RichText";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

const UI = {
  tr: { updated: "Son güncelleme", docs: "Yasal metinler", contents: "İçindekiler", questions: "Sorun mu var?", write: "Bize yaz", note: "" },
  en: {
    updated: "Last updated",
    docs: "Legal",
    contents: "Contents",
    questions: "Questions?",
    write: "Email us",
    note: "This English version is provided for convenience. If it differs from the Turkish version, the Turkish version prevails.",
  },
} as const;

function fmt(date: string, locale: Locale) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Metadata for /legal/<slug> and /en/legal/<slug> (static — does not need the settings). */
export function legalMetadata(slug: string, locale: Locale): Metadata {
  if (!isLegalSlug(slug)) return { title: "404" };
  const doc = getLegalDoc(slug, locale, legalInfo(publicSubset(mergeSettings(null))));
  const tr = `${SITE}/legal/${slug}`;
  const en = `${SITE}/en/legal/${slug}`;
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: locale === "en" ? en : tr, languages: { tr, en, "x-default": tr } },
    openGraph: { title: `${doc.title} · Prompt.Monster`, description: doc.description, url: locale === "en" ? en : tr },
  };
}

export async function LegalPage({ slug, locale }: { slug: string; locale: Locale }) {
  if (!isLegalSlug(slug)) notFound();
  const settings = await readPublicSettings();
  const info = legalInfo(settings);
  const doc = getLegalDoc(slug as LegalSlug, locale, info);
  const ui = UI[locale];

  return (
    <PublicShell locale={locale} langSwitch>
      <main className="max-w-[1100px] mx-auto px-4 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-[80px] self-start">
          <div className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-3">{ui.docs}</div>
          <nav className="flex flex-wrap lg:flex-col gap-1">
            {LEGAL_SLUGS.map((s) => (
              <Link
                key={s}
                href={localePath(`/legal/${s}`, locale)}
                aria-current={s === slug ? "page" : undefined}
                className={cx(
                  "shrink-0 flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] whitespace-nowrap",
                  s === slug ? "bg-ink-800 border border-ink-600 text-white font-semibold" : "text-zinc-400 hover:text-white",
                )}
              >
                <FileText className="w-3.5 h-3.5" aria-hidden /> {LEGAL_LABELS[locale][s]}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block mt-6 rounded-xl bg-ink-900 border border-ink-600 p-3 text-[12px] text-zinc-500">
            {ui.questions}{" "}
            <a href={`mailto:${info.email}`} className="text-lime hover:underline">
              {ui.write}
            </a>
            <div className="mt-1 break-all text-zinc-600">{info.email}</div>
          </div>
        </aside>

        <article className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{doc.title}</h1>
          <p className="mt-2 text-[12.5px] text-zinc-500">
            {ui.updated}: {fmt(LEGAL_UPDATED, locale)}
          </p>

          <div className="mt-6 space-y-3 text-[14.5px] leading-relaxed text-zinc-300">
            {doc.intro.map((p, idx) => (
              <p key={idx}>
                <RichText text={p} locale={locale} />
              </p>
            ))}
          </div>

          {doc.sections.length > 4 && (
            <nav aria-label={ui.contents} className="mt-8 rounded-2xl bg-ink-900 border border-ink-600 p-4">
              <div className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-2">{ui.contents}</div>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-zinc-400 hover:text-white">
                      {s.h}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-10 space-y-10">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-[18px] md:text-[20px] font-bold tracking-tight">{s.h}</h2>
                <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-zinc-300">
                  {s.blocks.map((b, idx) => (
                    <BlockView key={idx} block={b} locale={locale} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {ui.note && <p className="mt-12 text-[12px] text-zinc-500 border-t border-ink-600 pt-4">{ui.note}</p>}
        </article>
      </main>
    </PublicShell>
  );
}

function BlockView({ block, locale }: { block: Block; locale: Locale }) {
  if ("p" in block) {
    return (
      <p>
        <RichText text={block.p} locale={locale} />
      </p>
    );
  }
  if ("ul" in block) {
    return (
      <ul className="list-disc pl-5 space-y-2 marker:text-zinc-600">
        {block.ul.map((li, idx) => (
          <li key={idx}>
            <RichText text={li} locale={locale} />
          </li>
        ))}
      </ul>
    );
  }
  if ("note" in block) {
    return (
      <p className="rounded-xl bg-lime/5 border border-lime/20 px-4 py-3 text-zinc-200">
        <RichText text={block.note} locale={locale} />
      </p>
    );
  }
  if ("cookieButton" in block) {
    return (
      <div className="pt-1">
        <CookiePrefsButton />
      </div>
    );
  }
  return (
    <div className="overflow-x-auto scrollbar-thin rounded-xl border border-ink-600">
      <table className="min-w-full text-[13px]">
        <thead className="bg-ink-900">
          <tr>
            {block.table.head.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-zinc-300 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-600">
          {block.table.rows.map((row, r) => (
            <tr key={r} className="align-top">
              {row.map((cell, c) => (
                <td key={c} className={cx("px-3 py-2 text-zinc-400", c === 0 && "text-zinc-200 font-medium")}>
                  <RichText text={cell} locale={locale} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
