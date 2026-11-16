import type { Metadata } from "next";
import { ExploreView } from "@/components/site/ExploreView";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Keşfet — topluluğun paylaştığı build prompt'lar | Prompt.Monster",
  description: "Topluluğun galeriye eklediği gerçek master build prompt'ları keşfet; beğendiğini Studio'da aç ve kendi projen için çatalla.",
  alternates: alternatesFor("/explore", "tr"),
};

export default function ExplorePage() {
  return <ExploreView locale="tr" />;
}
