import type { Metadata } from "next";
import { PromptHubView, hubMeta } from "@/components/site/PromptPagesView";
import { loadCatalog } from "@/lib/catalog-server";
import { alternatesFor } from "@/lib/i18n";
import { SITE } from "@/lib/seo";

const m = hubMeta("en");

export const metadata: Metadata = {
  title: m.title,
  description: m.description,
  alternates: alternatesFor("/prompt", "en"),
  openGraph: { title: `${m.title} · Prompt.Monster`, description: m.description, url: `${SITE}/en/prompt`, siteName: "Prompt.Monster", locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: m.title, description: m.description },
  robots: { index: true, follow: true },
};

// Dynamic so project types hidden in /admin/catalog disappear without a deploy.
export const dynamic = "force-dynamic";

export default async function PromptHubPageEn() {
  await loadCatalog();
  return <PromptHubView locale="en" />;
}
