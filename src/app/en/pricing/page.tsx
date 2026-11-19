import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";
import { alternatesFor, ogImages } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free: 5 AI credits a day, 3 experts, project library. Monster Pro $29/mo: 1,000 AI credits a month, 18 experts, Mega Chain, 5 formats, Export to Builders.",
  alternates: alternatesFor("/pricing", "en"),
  openGraph: { title: "Prompt.Monster pricing", description: "Start free, go Pro when you get serious. $29/mo or $290/yr.", url: "https://prompter.monster/en/pricing", locale: "en_US", siteName: "Prompt.Monster", type: "website", images: ogImages("en") },
};

export default function PricingPageEn() {
  return <PricingView locale="en" />;
}
