import type { Metadata } from "next";
import { ExploreView } from "@/components/site/ExploreView";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore — build prompts shared by the community | Prompt.Monster",
  description: "Explore real master build prompts the community added to the gallery; open one in Studio and fork it for your own project.",
  alternates: alternatesFor("/explore", "en"),
};

export default function ExploreEnPage() {
  return <ExploreView locale="en" />;
}
