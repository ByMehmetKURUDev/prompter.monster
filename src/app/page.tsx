import type { Metadata } from "next";
import { LandingView } from "@/components/site/LandingView";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: alternatesFor("/", "tr"),
};

export default function Landing() {
  return <LandingView locale="tr" />;
}
