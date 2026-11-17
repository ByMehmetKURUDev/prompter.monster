import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreView } from "@/components/site/ExploreView";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";

// Rendered on demand: the Workers deployment has no incremental cache, so a prerendered dynamic
// route (generateStaticParams) would 404 there — bkz. /prompt/[slug]/page.tsx'teki aynı not.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: typeId } = await params;
  const type = ALL_PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) return { title: "Sayfa bulunamadı", robots: { index: false } };
  const title = `${type.icon} ${type.name} — Keşfet'te paylaşılan build prompt'lar | Prompt.Monster`;
  const description = `Topluluğun "${type.name}" proje tipi için paylaştığı gerçek master build prompt'ları keşfet; beğendiğini Studio'da aç ve kendi projen için çatalla.`;
  return {
    title,
    description,
    alternates: alternatesFor(`/explore/type/${type.id}`, "tr"),
    robots: { index: true, follow: true },
  };
}

export default async function ExploreTypePage({ params }: Props) {
  const { type: typeId } = await params;
  const type = ALL_PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) notFound();
  return <ExploreView locale="tr" filter={{ dimension: "type", id: type.id, icon: type.icon, name: type.name }} />;
}
