import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreView } from "@/components/site/ExploreView";
import { ALL_PROJECT_TYPES } from "@/lib/data";
import { socialFor } from "@/lib/i18n";
import { filterStats } from "@/lib/explore-server";
import { pageTitle, robotsWhen } from "@/lib/page-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: typeId } = await params;
  const type = ALL_PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) return { title: "Page not found", robots: { index: false } };
  const title = `${type.name} — build prompts on Explore`;
  const description = `Explore real master build prompts the community shared for "${type.name}" projects; open one in Studio and fork it for your own project.`;
  const stats = await filterStats(type.id, null);
  return {
    title: pageTitle(title),
    description,
    ...socialFor(`/explore/type/${type.id}`, "en", title, description),
    robots: robotsWhen(stats.total > 0),
  };
}

export default async function ExploreTypeEnPage({ params }: Props) {
  const { type: typeId } = await params;
  const type = ALL_PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) notFound();
  return <ExploreView locale="en" filter={{ dimension: "type", id: type.id, icon: type.icon, name: type.name }} />;
}
