import { ArrowRight, Link2, Rss } from "lucide-react";
import Link from "next/link";
import { CHANGELOG_TEXT, changelogPath, formatReleaseDate, publicReleases, type PublicRelease } from "@/lib/changelog-public";
import { lhref, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";

/** Public release notes (/changelog, /en/changelog): releases grouped by month, newest first. */
export function ChangelogView({ locale }: { locale: Locale }) {
  const t = CHANGELOG_TEXT[locale];
  const releases = publicReleases(locale);
  const months: { key: string; label: string; releases: PublicRelease[] }[] = [];
  for (const r of releases) {
    const key = r.date.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.releases.push(r);
    else months.push({ key, label: formatReleaseDate(r.date, locale, false), releases: [r] });
  }

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[780px] mx-auto px-4 lg:px-8 py-12">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-lime/10 text-lime border border-lime/30">
          {t.badge}
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{t.h1}</h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-[640px]">{t.lead}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`${changelogPath(locale)}/rss.xml`}
            className="h-9 px-3.5 rounded-lg border border-ink-600 bg-ink-800 text-[13px] text-zinc-200 hover:text-white flex items-center gap-1.5"
          >
            <Rss className="w-4 h-4 text-orange-400" aria-hidden /> {t.rss}
          </a>
          <Link href={lhref("/studio", locale)} className="h-9 px-3.5 rounded-lg bg-lime text-black text-[13px] font-bold flex items-center gap-1.5">
            {t.studio} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {months.map((m) => (
          <section key={m.key} className="mt-12" aria-labelledby={`m-${m.key}`}>
            <h2 id={`m-${m.key}`} className="text-[13px] font-bold tracking-widest uppercase text-zinc-500 border-b border-ink-600 pb-2">
              {m.label}
            </h2>
            <ol className="mt-2">
              {m.releases.map((r) => (
                <li key={r.version}>
                  <article id={r.anchor} className="scroll-mt-20 py-6 border-b border-ink-700 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="font-mono px-2 py-0.5 rounded-full bg-ink-800 border border-ink-600 text-lime">v{r.version}</span>
                      <time dateTime={r.date} className="text-zinc-500">
                        {formatReleaseDate(r.date, locale)}
                      </time>
                      <a href={`#${r.anchor}`} className="ml-auto text-zinc-600 hover:text-zinc-300" aria-label={t.linkToRelease(r.version)}>
                        <Link2 className="w-3.5 h-3.5" aria-hidden />
                      </a>
                    </div>
                    <h3 className="mt-2 text-[19px] font-bold tracking-tight">{r.title}</h3>
                    <ul className="mt-3 space-y-2 text-[14px] text-zinc-300 leading-relaxed list-disc pl-5 marker:text-zinc-600">
                      {r.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>
    </PublicShell>
  );
}
