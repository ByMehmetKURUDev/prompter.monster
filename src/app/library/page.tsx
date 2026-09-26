import type { Metadata } from "next";
import { LibraryPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "Projelerim", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return <LibraryPageView locale="tr" />;
}
