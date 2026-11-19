/**
 * Public "What's new" data for /changelog, /en/changelog and their RSS feeds — the releases of CHANGELOG that
 * have user-facing notes (`public`), newest first. Server-side only.
 */
import { CHANGELOG } from "./changelog";
import type { Locale } from "./i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

export interface PublicRelease {
  version: string;
  date: string;
  title: string;
  items: string[];
  /** In-page anchor: v4-17 */
  anchor: string;
}

export const CHANGELOG_TEXT = {
  tr: {
    metaTitle: "Yenilikler — Prompter.Monster'da neler değişti",
    metaDescription:
      "Prompter.Monster'ın sürüm notları: Studio, uzmanlar, Keşfet, takımlar, API ve MCP'deki yenilikler, en yenisi en üstte. RSS ile takip et.",
    badge: "Sürüm notları",
    h1: "Yenilikler",
    lead: "Prompter.Monster'a eklenen her şey, en yenisi en üstte. Takip etmek için RSS akışına abone olabilirsin.",
    rss: "RSS akışı",
    feedTitle: "Prompter.Monster — Yenilikler",
    feedDescription: "Prompter.Monster sürüm notları: yeni özellikler ve iyileştirmeler.",
    linkToRelease: (v: string) => `v${v} bağlantısı`,
    studio: "Studio'yu aç",
  },
  en: {
    metaTitle: "What's new — the Prompter.Monster changelog",
    metaDescription:
      "Prompter.Monster release notes: what's new in Studio, experts, Explore, teams, the API and MCP, newest first. Follow along with RSS.",
    badge: "Release notes",
    h1: "What's new",
    lead: "Everything we add to Prompter.Monster, newest first. Subscribe to the RSS feed to follow along.",
    rss: "RSS feed",
    feedTitle: "Prompter.Monster — What's new",
    feedDescription: "Prompter.Monster release notes: new features and improvements.",
    linkToRelease: (v: string) => `Link to v${v}`,
    studio: "Open Studio",
  },
} as const;

export function changelogPath(locale: Locale): string {
  return locale === "en" ? "/en/changelog" : "/changelog";
}

export function publicReleases(locale: Locale): PublicRelease[] {
  return CHANGELOG.filter((e) => e.public).map((e) => ({
    version: e.version,
    date: e.date,
    title: e.public![locale].title,
    items: e.public![locale].items,
    anchor: `v${e.version.replace(/\./g, "-")}`,
  }));
}

/** "19 Kasım 2026" / "November 19, 2026" (dates are calendar days, so UTC). */
export function formatReleaseDate(date: string, locale: Locale, withDay = true): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    ...(withDay ? { day: "numeric" } : {}),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RSS 2.0 feed of the public releases. */
export function changelogRss(locale: Locale): string {
  const t = CHANGELOG_TEXT[locale];
  const page = `${SITE_URL}${changelogPath(locale)}`;
  const releases = publicReleases(locale);
  const rfc822 = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();
  const items = releases
    .map((r) => {
      const html = `<ul>${r.items.map((i) => `<li>${xml(i)}</li>`).join("")}</ul>`;
      return [
        "    <item>",
        `      <title>${xml(`v${r.version} — ${r.title}`)}</title>`,
        `      <link>${page}#${r.anchor}</link>`,
        `      <guid isPermaLink="false">prompter.monster/changelog/${r.version}/${locale}</guid>`,
        `      <pubDate>${rfc822(r.date)}</pubDate>`,
        `      <description>${xml(html)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(t.feedTitle)}</title>`,
    `    <link>${page}</link>`,
    `    <atom:link href="${page}/rss.xml" rel="self" type="application/rss+xml"/>`,
    `    <description>${xml(t.feedDescription)}</description>`,
    `    <language>${locale}</language>`,
    releases.length ? `    <lastBuildDate>${rfc822(releases[0].date)}</lastBuildDate>` : "",
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function rssResponse(locale: Locale): Response {
  return new Response(changelogRss(locale), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
