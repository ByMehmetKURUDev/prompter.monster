import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";
import { alternatesFor } from "@/lib/i18n";
import { DEFAULT_PUBLIC } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Studio",
  description: "Turn your idea into a master build prompt in 4 steps: idea, stack, features, experts.",
  alternates: alternatesFor("/studio", "en"),
};

export default function StudioPageEn() {
  return <Studio dailyLimit={DEFAULT_PUBLIC().anon_credits_per_day} />;
}
