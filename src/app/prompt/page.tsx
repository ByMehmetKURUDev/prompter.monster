import type { Metadata } from "next";
import { PromptHubView, hubMeta } from "@/components/site/PromptPagesView";
import { alternatesFor } from "@/lib/i18n";
import { SITE } from "@/lib/seo";

const m = hubMeta("tr");

export const metadata: Metadata = {
  title: m.title,
  description: m.description,
  alternates: alternatesFor("/prompt", "tr"),
  openGraph: { title: `${m.title} · Prompt.Monster`, description: m.description, url: `${SITE}/prompt`, siteName: "Prompt.Monster", locale: "tr_TR", type: "website" },
  twitter: { card: "summary_large_image", title: m.title, description: m.description },
  robots: { index: true, follow: true },
};

export default function PromptHubPage() {
  return <PromptHubView locale="tr" />;
}
