import type { Metadata } from "next";
import { ExploreView } from "@/components/site/ExploreView";
import { socialFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLE = "Keşfet — topluluğun paylaştığı build prompt'lar";
const DESCRIPTION = "Topluluğun galeriye eklediği gerçek master build prompt'ları keşfet; beğendiğini Studio'da aç ve kendi projen için çatalla.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...socialFor("/explore", "tr", TITLE, DESCRIPTION),
};

export default function ExplorePage() {
  return <ExploreView locale="tr" />;
}
