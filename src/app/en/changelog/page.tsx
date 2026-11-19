import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { ChangelogView } from "@/components/site/ChangelogView";
import { CHANGELOG_TEXT } from "@/lib/changelog-public";
import { socialFor } from "@/lib/i18n";

const m = CHANGELOG_TEXT.en;
const social = socialFor("/changelog", "en", m.metaTitle, m.metaDescription);

export const metadata: Metadata = {
  title: pageTitle(m.metaTitle),
  description: m.metaDescription,
  ...social,
  alternates: { ...social.alternates, types: { "application/rss+xml": [{ url: "/en/changelog/rss.xml", title: m.feedTitle }] } },
  robots: { index: true, follow: true },
};

export default function ChangelogPageEn() {
  return <ChangelogView locale="en" />;
}
