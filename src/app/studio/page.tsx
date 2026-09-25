import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";
import { dailyLimit } from "@/lib/ratelimit";

export const metadata: Metadata = {
  title: "Studio",
  description: "Fikrini 4 adımda master build prompt'a çevir: fikir, stack, özellikler, uzmanlar.",
};

export default function StudioPage() {
  return <Studio dailyLimit={dailyLimit()} />;
}
