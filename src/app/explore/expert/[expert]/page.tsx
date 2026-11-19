import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreView } from "@/components/site/ExploreView";
import { EXPERTS } from "@/lib/data";
import { socialFor } from "@/lib/i18n";

// Rendered on demand: the Workers deployment has no incremental cache, so a prerendered dynamic
// route (generateStaticParams) would 404 there — bkz. /prompt/[slug]/page.tsx'teki aynı not.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ expert: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { expert: expertId } = await params;
  const expert = EXPERTS.find((e) => e.id === expertId);
  if (!expert) return { title: "Sayfa bulunamadı", robots: { index: false } };
  const title = `${expert.role} — Keşfet'te paylaşılan build prompt'lar`;
  const description = `${expert.role} uzmanının katıldığı, topluluğun paylaştığı gerçek master build prompt'ları keşfet; beğendiğini Studio'da aç ve kendi projen için çatalla.`;
  return {
    title,
    description,
    ...socialFor(`/explore/expert/${expert.id}`, "tr", title, description),
    robots: { index: true, follow: true },
  };
}

export default async function ExploreExpertPage({ params }: Props) {
  const { expert: expertId } = await params;
  const expert = EXPERTS.find((e) => e.id === expertId);
  if (!expert) notFound();
  return <ExploreView locale="tr" filter={{ dimension: "expert", id: expert.id, icon: expert.emoji, name: expert.role }} />;
}
