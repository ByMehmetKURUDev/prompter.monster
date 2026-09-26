import type { Metadata } from "next";
import { PasswordPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "Yeni şifre", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function PasswordPage() {
  return <PasswordPageView locale="tr" />;
}
