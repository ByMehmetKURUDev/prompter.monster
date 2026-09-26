import Link from "next/link";
import type { ReactNode } from "react";
import { lhref, type Locale } from "@/lib/i18n";

/**
 * Minimal inline markup renderer (server-safe): [label](href) and **bold**.
 * Internal paths are localized with lhref; external links open in a new tab.
 */
export function RichText({ text, locale }: { text: string; locale: Locale }) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[3] !== undefined) {
      out.push(
        <strong key={k++} className="text-zinc-100 font-semibold">
          {m[3]}
        </strong>,
      );
    } else {
      const [label, href] = [m[1], m[2]];
      const cls = "text-lime hover:underline underline-offset-2";
      if (href.startsWith("/")) {
        out.push(
          <Link key={k++} href={lhref(href, locale)} className={cls}>
            {label}
          </Link>,
        );
      } else if (href.startsWith("mailto:")) {
        out.push(
          <a key={k++} href={href} className={cls}>
            {label}
          </a>,
        );
      } else {
        out.push(
          <a key={k++} href={href} className={cls} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
