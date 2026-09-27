import type { Metadata } from "next";
import { AccountPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AccountPage() {
  return <AccountPageView locale="tr" />;
}
