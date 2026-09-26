import type { Metadata } from "next";
import { DocsView, docsUi } from "@/components/site/DocsView";
import { alternatesFor } from "@/lib/i18n";
import { SITE } from "@/lib/docs";

const ui = docsUi("tr");

export const metadata: Metadata = {
  title: ui.title,
  description: ui.description,
  alternates: alternatesFor("/docs", "tr"),
  openGraph: { title: `${ui.title} · Prompt.Monster`, description: ui.description, url: `${SITE}/docs`, siteName: "Prompt.Monster", locale: ui.ogLocale, type: "article" },
  robots: { index: true, follow: true },
};

export default function DocsPage() {
  return <DocsView locale="tr" />;
}
