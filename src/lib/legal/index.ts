import type { Locale } from "../i18n";
import type { PublicSettings } from "../settings";
import { enDoc } from "./en";
import { trDoc } from "./tr";
import { LEGAL_SLUGS, type LegalDoc, type LegalInfo, type LegalSlug } from "./types";
import { trackingConfigured } from "../consent";

export * from "./types";

export function isLegalSlug(v: string): v is LegalSlug {
  return (LEGAL_SLUGS as string[]).includes(v);
}

export function legalInfo(s: Pick<PublicSettings, "legal_name" | "legal_email" | "legal_address" | "legal_registry">): LegalInfo {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");
  return {
    name: s.legal_name?.trim() || "Mehmet Kuru",
    email: s.legal_email?.trim() || "hello@prompter.monster",
    address: s.legal_address?.trim() || "",
    registry: s.legal_registry?.trim() || "",
    site: site.replace(/^https?:\/\//, ""),
    tracking: trackingConfigured(),
  };
}

export function getLegalDoc(slug: LegalSlug, locale: Locale, info: LegalInfo): LegalDoc {
  return locale === "en" ? enDoc(slug, info) : trDoc(slug, info);
}

export { LEGAL_LABELS } from "./labels";
