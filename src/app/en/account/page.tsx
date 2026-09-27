import type { Metadata } from "next";
import { AccountPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AccountPageEn() {
  return <AccountPageView locale="en" />;
}
