import type { Metadata } from "next";
import { UnsubscribeView } from "@/components/site/UnsubscribeView";

export const metadata: Metadata = { title: "E-mail preference", robots: { index: false, follow: false } };

export default async function UnsubscribePageEn({ searchParams }: { searchParams: Promise<{ t?: string; done?: string; error?: string }> }) {
  return <UnsubscribeView locale="en" searchParams={await searchParams} />;
}
