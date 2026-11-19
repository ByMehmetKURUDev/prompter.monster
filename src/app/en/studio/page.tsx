import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";
import { CHANGELOG } from "@/lib/changelog";
import { socialFor } from "@/lib/i18n";
import { DEFAULT_PUBLIC } from "@/lib/settings";

const DESCRIPTION = "Turn your idea into a master build prompt in 4 steps: idea, stack, features, experts.";

export const metadata: Metadata = {
  title: "Studio",
  description: DESCRIPTION,
  ...socialFor("/studio", "en", "Prompt.Monster Studio — turn your idea into a master build prompt in 4 steps", DESCRIPTION),
};

export default function StudioPageEn() {
  return <Studio dailyLimit={DEFAULT_PUBLIC().anon_credits_per_day} version={CHANGELOG[0]?.version} />;
}
