"use client";

import { useLocale } from "@/components/site/LocaleProvider";
import { STUDIO_TEXT, type StudioText } from "@/lib/studio-i18n";

/** Studio UI strings for the current locale ("tr" by default, "en" under app/en/layout.tsx). */
export function useT(): StudioText {
  return STUDIO_TEXT[useLocale()];
}
