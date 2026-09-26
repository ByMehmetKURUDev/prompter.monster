import type { Metadata } from "next";
import { DEV_META, DevelopersView } from "@/components/site/DevelopersView";
import { alternatesFor } from "@/lib/i18n";

const m = DEV_META.en;

export const metadata: Metadata = {
  title: m.title,
  description: m.description,
  alternates: alternatesFor("/developers", "en"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/en/developers", siteName: "Prompt.Monster", locale: "en_US", type: "website" },
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default function DevelopersPageEn() {
  return <DevelopersView locale="en" />;
}
