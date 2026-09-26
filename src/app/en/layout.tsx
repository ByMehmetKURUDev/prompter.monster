import type { ReactNode } from "react";
import { HtmlLang, LocaleProvider } from "@/components/site/LocaleProvider";

/** Everything under /en renders in English: client components read the locale from this provider. */
export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale="en">
      <HtmlLang lang="en" />
      {children}
    </LocaleProvider>
  );
}
