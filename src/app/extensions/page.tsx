import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { EXT_META, ExtensionsView } from "@/components/site/ExtensionsView";
import { alternatesFor, ogImages } from "@/lib/i18n";

const m = EXT_META.tr;

export const metadata: Metadata = {
  title: pageTitle(m.title),
  description: m.description,
  alternates: alternatesFor("/extensions", "tr"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/extensions", siteName: "Prompter.Monster", locale: "tr_TR", type: "website", images: ogImages("tr") },
  robots: { index: true, follow: true },
};

export default function ExtensionsPage() {
  return <ExtensionsView locale="tr" />;
}
