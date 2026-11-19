import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { LeaderboardView } from "@/components/site/LeaderboardView";
import { socialFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TITLE = "Usta Canavarlar — en çok beğenilen paylaşımlar";
const DESCRIPTION = "Topluluktan en çok beğeni alan Keşfet paylaşımlarının sahipleri. Haftalık, aylık ve tüm zamanlar lider tablosu.";

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  ...socialFor("/explore/leaderboard", "tr", TITLE, DESCRIPTION),
};

export default function LeaderboardPage() {
  return <LeaderboardView locale="tr" />;
}
