import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/site/LegalView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ doc: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return legalMetadata(doc, "en");
}

export default async function Page({ params }: Props) {
  const { doc } = await params;
  return <LegalPage slug={doc} locale="en" />;
}
