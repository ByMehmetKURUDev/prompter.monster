import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-meta";
import { DEV_META, DevelopersView } from "@/components/site/DevelopersView";
import { alternatesFor, ogImages } from "@/lib/i18n";

const m = DEV_META.tr;

export const metadata: Metadata = {
  title: pageTitle(m.title),
  description: m.description,
  alternates: alternatesFor("/developers", "tr"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/developers", siteName: "Prompter.Monster", locale: "tr_TR", type: "website", images: ogImages("tr") },
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default function DevelopersPage() {
  return <DevelopersView locale="tr" />;
}
