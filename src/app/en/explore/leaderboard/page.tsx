import type { Metadata } from "next";
import { LeaderboardView } from "@/components/site/LeaderboardView";
import { socialFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLE = "Master Monsters — most-liked shares";
const DESCRIPTION = "The creators whose Explore shares picked up the most likes from the community. Weekly, monthly and all-time leaderboard.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...socialFor("/explore/leaderboard", "en", TITLE, DESCRIPTION),
};

export default function LeaderboardEnPage() {
  return <LeaderboardView locale="en" />;
}
