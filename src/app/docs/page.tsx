import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { DocsView, docsUi } from "@/components/site/DocsView";
import { alternatesFor, ogImages } from "@/lib/i18n";
import { SITE } from "@/lib/docs";

const ui = docsUi("tr");

export const metadata: Metadata = {
  title: pageTitle(ui.title),
  description: ui.description,
  alternates: alternatesFor("/docs", "tr"),
  openGraph: { title: `${ui.title} · Prompter.Monster`, description: ui.description, url: `${SITE}/docs`, siteName: "Prompter.Monster", locale: ui.ogLocale, type: "article", images: ogImages("tr") },
  robots: { index: true, follow: true },
};

export default function DocsPage() {
  return <DocsView locale="tr" />;
}
