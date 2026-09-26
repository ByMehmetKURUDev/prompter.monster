"use client";

import { Cookie } from "lucide-react";
import { openConsentPreferences, trackingConfigured } from "@/lib/consent";
import { useLocale } from "./LocaleProvider";

/** Re-opens the cookie banner in preferences mode. Hidden when no optional tag is configured. */
export function CookiePrefsButton() {
  const locale = useLocale();
  if (!trackingConfigured()) return null;
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] font-semibold hover:border-ink-400"
    >
      <Cookie className="w-4 h-4 text-lime" aria-hidden />
      {locale === "en" ? "Change cookie choices" : "Çerez tercihlerini değiştir"}
    </button>
  );
}
