import type { Metadata } from "next";
import { TypePageView, typePageMeta } from "@/components/site/PromptPagesView";
import { loadCatalog } from "@/lib/catalog-server";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = typePageMeta(slug, "en");
  if (!m) return { title: "Page not found", robots: { index: false } };
  const { page, url } = m;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: alternatesFor(`/prompt/${page.slug}`, "en"),
    openGraph: { type: "article", title: `${page.title} · Prompt.Monster`, description: page.description, url, siteName: "Prompt.Monster", locale: "en_US" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
    robots: { index: true, follow: true },
  };
}

export default async function TypePromptPageEn({ params }: Props) {
  const { slug } = await params;
  await loadCatalog();
  return <TypePageView slug={slug} locale="en" />;
}
