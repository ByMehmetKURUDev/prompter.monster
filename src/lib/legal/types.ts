export type LegalSlug = "terms" | "privacy" | "cookies" | "refund";

export const LEGAL_SLUGS: LegalSlug[] = ["terms", "privacy", "cookies", "refund"];

/** Last material change to any legal text (shown on every page). Bump when the wording changes. */
export const LEGAL_UPDATED = "2026-09-26";

/** Operator details — editable in /admin/settings (group "Yasal"). */
export interface LegalInfo {
  name: string;
  email: string;
  address: string;
  registry: string;
  site: string;
  /** True when an analytics/ads tag is configured (cookie policy wording depends on it). */
  tracking: boolean;
}

/**
 * Inline markup inside strings: [label](/path or https://… or mailto:…) and **bold**.
 * Internal paths are written in their Turkish form ("/pricing"); the renderer localizes them.
 */
export type Block =
  | { p: string }
  | { ul: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string }
  | { cookieButton: true };

export interface LegalSection {
  id: string;
  h: string;
  blocks: Block[];
}

export interface LegalDoc {
  slug: LegalSlug;
  /** Page title (h1 + <title>). */
  title: string;
  /** Short label for navigation. */
  short: string;
  description: string;
  intro: string[];
  sections: LegalSection[];
}
