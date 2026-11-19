import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { EXT_META, ExtensionsView } from "@/components/site/ExtensionsView";
import { alternatesFor, ogImages } from "@/lib/i18n";

const m = EXT_META.en;

export const metadata: Metadata = {
  title: pageTitle(m.title),
  description: m.description,
  alternates: alternatesFor("/extensions", "en"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/en/extensions", siteName: "Prompter.Monster", locale: "en_US", type: "website", images: ogImages("en") },
  robots: { index: true, follow: true },
};

export default function ExtensionsPageEn() {
  return <ExtensionsView locale="en" />;
}
