import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HtmlLang, LocaleProvider } from "@/components/site/LocaleProvider";
import { ogImages, twitterImages } from "@/lib/i18n";

/** English defaults for every /en page that doesn't set its own. */
export const metadata: Metadata = {
  description:
    "Turn your product idea into copy-paste-ready master build prompts for Claude Code, Cursor, v0, Lovable and Bolt — written by 18 expert personas.",
  // A child openGraph replaces the parent's, so the English defaults are complete (image included).
  openGraph: {
    type: "website",
    siteName: "Prompter.Monster",
    locale: "en_US",
    title: "Prompter.Monster — From idea to master build prompt",
    description: "18 expert monsters, an 8-step Mega Chain, 5 output formats. Turn your idea into a build prompt for AI coding tools.",
    images: ogImages("en"),
  },
  twitter: { card: "summary_large_image", title: "Prompter.Monster", description: "From idea to master build prompt.", images: twitterImages("en") },
};

/** Everything under /en renders in English: client components read the locale from this provider. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale="en">
      {/* The root layout renders <html lang="tr">. In production the Worker already rewrites it to "en" in the HTML
          (custom-worker.ts); this script covers next dev and any path the rewrite misses. HtmlLang keeps it right on
          client-side navigations. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='en'" }} />
      <HtmlLang lang="en" />
      {children}
    </LocaleProvider>
  );
}
