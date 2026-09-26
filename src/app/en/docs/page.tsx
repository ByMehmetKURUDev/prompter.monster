import type { Metadata } from "next";
import { DocsView, docsUi } from "@/components/site/DocsView";
import { alternatesFor } from "@/lib/i18n";
import { SITE } from "@/lib/docs";

const ui = docsUi("en");

export const metadata: Metadata = {
  title: ui.title,
  description: ui.description,
  alternates: alternatesFor("/docs", "en"),
  openGraph: { title: `${ui.title} · Prompt.Monster`, description: ui.description, url: `${SITE}/en/docs`, siteName: "Prompt.Monster", locale: ui.ogLocale, type: "article" },
  robots: { index: true, follow: true },
};

export default function DocsPageEn() {
  return <DocsView locale="en" />;
}
