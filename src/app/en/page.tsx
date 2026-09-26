import type { Metadata } from "next";
import { LandingView } from "@/components/site/LandingView";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: "Prompt.Monster — From idea to master build prompt" },
  description:
    "Turn your product idea into copy-paste-ready master build prompts for Claude Code, Cursor, v0, Lovable and Bolt — written by 12 expert personas, with an 8-step Mega Chain and .cursorrules / CLAUDE.md exports.",
  alternates: alternatesFor("/", "en"),
  openGraph: {
    type: "website",
    siteName: "Prompt.Monster",
    locale: "en_US",
    title: "Prompt.Monster — From idea to master build prompt",
    description: "12 expert monsters, an 8-step Mega Chain, 5 output formats. Turn your idea into a build prompt for AI coding tools.",
    url: "https://prompter.monster/en",
  },
  twitter: { card: "summary_large_image", title: "Prompt.Monster", description: "From idea to master build prompt." },
};

export default function LandingEn() {
  return <LandingView locale="en" />;
}
