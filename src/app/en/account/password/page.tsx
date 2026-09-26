import type { Metadata } from "next";
import { PasswordPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "New password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function PasswordPageEn() {
  return <PasswordPageView locale="en" />;
}
