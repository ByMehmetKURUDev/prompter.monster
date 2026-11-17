import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreView } from "@/components/site/ExploreView";
import { EXPERTS } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ expert: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { expert: expertId } = await params;
  const expert = EXPERTS.find((e) => e.id === expertId);
  if (!expert) return { title: "Page not found", robots: { index: false } };
  const title = `${expert.emoji} ${expert.role} — build prompts shared on Explore | Prompt.Monster`;
  const description = `Explore real master build prompts the community shared that used the ${expert.role} expert; open one in Studio and fork it for your own project.`;
  return {
    title,
    description,
    alternates: alternatesFor(`/explore/expert/${expert.id}`, "en"),
    robots: { index: true, follow: true },
  };
}

export default async function ExploreExpertEnPage({ params }: Props) {
  const { expert: expertId } = await params;
  const expert = EXPERTS.find((e) => e.id === expertId);
  if (!expert) notFound();
  return <ExploreView locale="en" filter={{ dimension: "expert", id: expert.id, icon: expert.emoji, name: expert.role }} />;
}
