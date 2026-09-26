import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/site/LegalView";

// Reads the operator details from the admin settings at request time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ doc: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return legalMetadata(doc, "tr");
}

export default async function Page({ params }: Props) {
  const { doc } = await params;
  return <LegalPage slug={doc} locale="tr" />;
}
