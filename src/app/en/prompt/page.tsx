import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { PromptHubView, hubMeta } from "@/components/site/PromptPagesView";
import { loadCatalog } from "@/lib/catalog-server";
import { alternatesFor, ogImages, twitterImages } from "@/lib/i18n";
import { SITE } from "@/lib/seo";

const m = hubMeta("en");

export const metadata: Metadata = {
  title: pageTitle(m.title),
  description: m.description,
  alternates: alternatesFor("/prompt", "en"),
  openGraph: { title: `${m.title} · Prompter.Monster`, description: m.description, url: `${SITE}/en/prompt`, siteName: "Prompter.Monster", locale: "en_US", type: "website", images: ogImages("en") },
  twitter: { card: "summary_large_image", title: m.title, description: m.description, images: twitterImages("en") },
  robots: { index: true, follow: true },
};

// Dynamic so project types hidden in /admin/catalog disappear without a deploy.
export const dynamic = "force-dynamic";

export default async function PromptHubPageEn() {
  await loadCatalog();
  return <PromptHubView locale="en" />;
}
