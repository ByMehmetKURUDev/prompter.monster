import type { Metadata } from "next";
import { LoginPageView } from "@/components/site/AccountViews";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPageEn({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; msg?: string }> }) {
  return <LoginPageView locale="en" searchParams={await searchParams} />;
}
