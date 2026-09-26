import type { Metadata } from "next";
import { TypePageView, typePageMeta } from "@/components/site/PromptPagesView";
import { loadCatalog } from "@/lib/catalog-server";
import { alternatesFor } from "@/lib/i18n";

// Rendered on demand: the Workers deployment has no incremental cache, so prerendered dynamic
// routes (generateStaticParams) would 404 there. Content is in code, so rendering is instant.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = typePageMeta(slug, "tr");
  if (!m) return { title: "Sayfa bulunamadı", robots: { index: false } };
  const { page, url } = m;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: alternatesFor(`/prompt/${page.slug}`, "tr"),
    openGraph: { type: "article", title: `${page.title} · Prompt.Monster`, description: page.description, url, siteName: "Prompt.Monster", locale: "tr_TR" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
    robots: { index: true, follow: true },
  };
}

export default async function TypePromptPage({ params }: Props) {
  const { slug } = await params;
  await loadCatalog();
  return <TypePageView slug={slug} locale="tr" />;
}
