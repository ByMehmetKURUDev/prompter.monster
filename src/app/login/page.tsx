import type { Metadata } from "next";
import { LoginPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; msg?: string }> }) {
  return <LoginPageView locale="tr" searchParams={await searchParams} />;
}
