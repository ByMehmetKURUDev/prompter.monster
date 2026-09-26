import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";
import { alternatesFor } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Prompt.Monster starts free: 5 AI credits a day, 3 experts, project library. Monster Pro $29/mo: 1,000 AI credits a month, 12 experts, Mega Chain, 5 formats and Export to Builders.",
  alternates: alternatesFor("/pricing", "en"),
  openGraph: { title: "Prompt.Monster pricing", description: "Start free, go Pro when you get serious. $29/mo or $290/yr.", url: "https://prompter.monster/en/pricing", locale: "en_US" },
};

export default function PricingPageEn() {
  return <PricingView locale="en" />;
}
