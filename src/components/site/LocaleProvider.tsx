"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, stripLocale, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Root layout provides "tr"; app/en/layout.tsx overrides with "en" for everything under /en. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Locale from the URL — for components rendered by the root layout (outside app/en/layout.tsx). */
export function usePathLocale(): Locale {
  return stripLocale(usePathname() || "/").locale;
}

/** Keeps <html lang> in sync for screen readers when an /en page is shown (root layout renders lang="tr"). */
export function HtmlLang({ lang }: { lang: Locale }) {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev || DEFAULT_LOCALE;
    };
  }, [lang]);
  return null;
}
