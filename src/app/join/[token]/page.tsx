import type { Metadata } from "next";
import { JoinTeamView } from "@/components/site/JoinTeamView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Takım daveti", robots: { index: false, follow: false } };

export default async function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <JoinTeamView locale="tr" token={token} />;
}
