import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HtmlLang, LocaleProvider } from "@/components/site/LocaleProvider";

/** English defaults for every /en page that doesn't set its own. */
export const metadata: Metadata = {
  description:
    "Turn your product idea into copy-paste-ready master build prompts for Claude Code, Cursor, v0, Lovable and Bolt — written by 12 expert personas.",
  openGraph: { locale: "en_US", siteName: "Prompt.Monster" },
};

/** Everything under /en renders in English: client components read the locale from this provider. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale="en">
      <HtmlLang lang="en" />
      {children}
    </LocaleProvider>
  );
}
