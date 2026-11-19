import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { DEV_META, DevelopersView } from "@/components/site/DevelopersView";
import { alternatesFor, ogImages } from "@/lib/i18n";

const m = DEV_META.en;

export const metadata: Metadata = {
  title: pageTitle(m.title),
  description: m.description,
  alternates: alternatesFor("/developers", "en"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/en/developers", siteName: "Prompter.Monster", locale: "en_US", type: "website", images: ogImages("en") },
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default function DevelopersPageEn() {
  return <DevelopersView locale="en" />;
}
