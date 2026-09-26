import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";
import { DEFAULT_PUBLIC } from "@/lib/settings";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Studio",
  description: "Fikrini 4 adımda master build prompt'a çevir: fikir, stack, özellikler, uzmanlar.",
  alternates: alternatesFor("/studio", "tr"),
};

export default function StudioPage() {
  return <Studio dailyLimit={DEFAULT_PUBLIC().anon_credits_per_day} />;
}
