import type { Metadata } from "next";
import { LeaderboardView } from "@/components/site/LeaderboardView";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usta Canavarlar — en çok beğenilen paylaşımlar | Prompt.Monster",
  description: "Topluluktan en çok beğeni alan Keşfet paylaşımlarının sahipleri. Haftalık, aylık ve tüm zamanlar lider tablosu.",
  alternates: alternatesFor("/explore/leaderboard", "tr"),
};

export default function LeaderboardPage() {
  return <LeaderboardView locale="tr" />;
}
