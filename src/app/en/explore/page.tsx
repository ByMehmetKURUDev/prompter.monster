import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { ExploreView } from "@/components/site/ExploreView";
import { socialFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLE = "Explore — build prompts shared by the community";
const DESCRIPTION = "Explore real master build prompts the community added to the gallery; open one in Studio and fork it for your own project.";

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  ...socialFor("/explore", "en", TITLE, DESCRIPTION),
};

export default function ExploreEnPage() {
  return <ExploreView locale="en" />;
}
