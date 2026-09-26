import Link from "next/link";
import { lhref, type Locale } from "@/lib/i18n";
import { LEGAL_LABELS, LEGAL_SLUGS } from "@/lib/legal/labels";
import { cx } from "@/lib/cx";

/** Footer links to the legal pages (server-safe, no hooks). */
export function LegalLinks({ locale = "tr", className, separator = true }: { locale?: Locale; className?: string; separator?: boolean }) {
  return (
    <span className={cx("inline-flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {LEGAL_SLUGS.map((slug, i) => (
        <span key={slug} className="inline-flex items-center gap-3">
          {separator && i > 0 && <span aria-hidden>•</span>}
          <Link href={lhref(`/legal/${slug}`, locale)} className="hover:text-zinc-300">
            {LEGAL_LABELS[locale][slug]}
          </Link>
        </span>
      ))}
    </span>
  );
}
