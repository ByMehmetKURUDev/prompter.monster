import type { Metadata } from "next";
import { LeaderboardView } from "@/components/site/LeaderboardView";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Master Monsters — most-liked shares | Prompt.Monster",
  description: "The creators whose Explore shares picked up the most likes from the community. Weekly, monthly and all-time leaderboard.",
  alternates: alternatesFor("/explore/leaderboard", "en"),
};

export default function LeaderboardEnPage() {
  return <LeaderboardView locale="en" />;
}
