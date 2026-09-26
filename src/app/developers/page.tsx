import type { Metadata } from "next";
import { DEV_META, DevelopersView } from "@/components/site/DevelopersView";
import { alternatesFor } from "@/lib/i18n";

const m = DEV_META.tr;

export const metadata: Metadata = {
  title: m.title,
  description: m.description,
  alternates: alternatesFor("/developers", "tr"),
  openGraph: { title: m.title, description: m.description, url: "https://prompter.monster/developers", siteName: "Prompt.Monster", locale: "tr_TR", type: "website" },
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default function DevelopersPage() {
  return <DevelopersView locale="tr" />;
}
