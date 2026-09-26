"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, enReady, localePath, stripLocale, type Locale } from "@/lib/i18n";
import { cx } from "@/lib/cx";

/** TR ⇄ EN switch (hidden on pages without an English version). Remembers the explicit choice in the pm_lang cookie (1 year) and keeps the query string. */
export function LanguageSwitch({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const { locale, path } = stripLocale(pathname);
  const target: Locale = locale === "tr" ? "en" : "tr";
  const href = localePath(path, target);
  // Only offer the switch where the other language exists (English pages ship route by route).
  if (!enReady(path)) return null;

  return (
    <a
      href={href}
      hrefLang={target}
      onClick={(e) => {
        e.preventDefault();
        try {
          document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
        } catch {
          /* cookies disabled — navigation still works */
        }
        window.location.assign(href + window.location.search + window.location.hash);
      }}
      className={cx("inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-ink-600 text-[12px] text-zinc-400 hover:text-white hover:border-ink-400", className)}
      aria-label={target === "en" ? "Switch to English" : "Türkçeye geç"}
    >
      <Languages className="w-3.5 h-3.5 hidden sm:block" aria-hidden />
      {target === "en" ? "EN" : "TR"}
    </a>
  );
}
