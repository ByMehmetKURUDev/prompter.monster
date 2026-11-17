import type { Metadata } from "next";
import { generateProfileMetadata, ProfileView } from "@/components/site/ProfileView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return generateProfileMetadata(username, "en");
}

export default async function ProfilePageEn({ params }: Props) {
  const { username } = await params;
  return <ProfileView username={username} locale="en" />;
}
