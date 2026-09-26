import type { Metadata } from "next";
import { LibraryPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "My projects", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function LibraryPageEn() {
  return <LibraryPageView locale="en" />;
}
