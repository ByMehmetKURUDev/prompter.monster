import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";
import { CHANGELOG } from "@/lib/changelog";
import { DEFAULT_PUBLIC } from "@/lib/settings";
import { socialFor } from "@/lib/i18n";

const DESCRIPTION = "Fikrini 4 adımda master build prompt'a çevir: fikir, stack, özellikler, uzmanlar.";

export const metadata: Metadata = {
  title: "Studio",
  description: DESCRIPTION,
  ...socialFor("/studio", "tr", "Prompter.Monster Studio — fikrini 4 adımda master build prompt'a çevir", DESCRIPTION),
};

export default function StudioPage() {
  return <Studio dailyLimit={DEFAULT_PUBLIC().anon_credits_per_day} version={CHANGELOG[0]?.version} />;
}
