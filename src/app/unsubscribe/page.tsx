import type { Metadata } from "next";
import { UnsubscribeView } from "@/components/site/UnsubscribeView";

export const metadata: Metadata = { title: "E-posta tercihi", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string; error?: string }> }) {
  return <UnsubscribeView locale="tr" searchParams={await searchParams} />;
}
