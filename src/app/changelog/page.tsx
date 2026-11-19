import type { Metadata } from "next";
import { ChangelogView } from "@/components/site/ChangelogView";
import { CHANGELOG_TEXT } from "@/lib/changelog-public";
import { socialFor } from "@/lib/i18n";

const m = CHANGELOG_TEXT.tr;
const social = socialFor("/changelog", "tr", m.metaTitle, m.metaDescription);

export const metadata: Metadata = {
  title: m.metaTitle,
  description: m.metaDescription,
  ...social,
  alternates: { ...social.alternates, types: { "application/rss+xml": [{ url: "/changelog/rss.xml", title: m.feedTitle }] } },
  robots: { index: true, follow: true },
};

export default function ChangelogPage() {
  return <ChangelogView locale="tr" />;
}
