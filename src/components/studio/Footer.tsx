"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { LegalLinks } from "@/components/site/LegalLinks";
import { useLocale } from "@/components/site/LocaleProvider";
import { lhref } from "@/lib/i18n";
import { useT } from "./useT";

/** `version` comes from the server page, so the changelog itself stays out of the client bundle. */
export function Footer({ version }: { version?: string }) {
  const locale = useLocale();
  const t = useT().footer;
  return (
    <div className="border-t border-ink-600 bg-ink-950 px-4 lg:px-8 py-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-600">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-lime" /> {t.stats}
      </span>
      <span className="hidden md:flex items-center gap-1.5">
        • <Globe className="w-3 h-3" aria-hidden /> {t.trPayments}
      </span>
      <LegalLinks locale={locale} className="hidden sm:inline-flex" />
      <span className="ml-auto flex items-center gap-2">
        {version && (
          <Link
            href={lhref("/changelog", locale)}
            title={t.changelog}
            className="px-2 py-1 rounded-full bg-ink-800 border border-ink-600 hover:text-zinc-300 hover:border-ink-400"
          >
            v{version}
          </Link>
        )}
        <span>Prompter.Monster © {new Date().getFullYear()}</span>
      </span>
    </div>
  );
}
