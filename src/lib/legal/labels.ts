import type { Locale } from "../i18n";
import { LEGAL_SLUGS, type LegalSlug } from "./types";

/** Lightweight labels for nav/footers (kept apart so client bundles never pull the full legal texts). */
export { LEGAL_SLUGS };

export const LEGAL_LABELS: Record<Locale, Record<LegalSlug, string>> = {
  tr: { terms: "Kullanım Koşulları", privacy: "Gizlilik (KVKK)", cookies: "Çerezler", refund: "İade" },
  en: { terms: "Terms", privacy: "Privacy", cookies: "Cookies", refund: "Refunds" },
};
