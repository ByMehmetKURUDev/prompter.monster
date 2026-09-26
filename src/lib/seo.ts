import { EMPTY_STATE, EXPERTS, PAYMENTS, PROJECT_CATEGORIES } from "./data";
import { buildExpertPrompt, buildMegaHeader } from "./prompt";
import { TYPE_PAGES, type TypePage } from "./seo-types";
import { quickStartState } from "./type-presets";
import type { Expert, StudioState } from "./types";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

export { stackFor } from "./type-presets";

/** A complete Studio state seeded from a type page, with the sample idea filled in. */
export function sampleStateFor(page: TypePage): StudioState {
  const base = quickStartState(page.id) ?? EMPTY_STATE;
  return {
    ...base,
    name: page.name,
    pitch: page.samplePitch,
    description: page.sampleDescription,
    audience: { role: page.audience, pain: "", budget: "" },
    lang: "TR",
    format: "Claude XML",
  };
}

/** Shortened master prompt shown on the landing page: header + first expert block, trimmed. */
export function promptExcerpt(page: TypePage, maxChars = 2600): { text: string; truncated: boolean } {
  const s = sampleStateFor(page);
  const full = [buildMegaHeader(s), buildExpertPrompt(s, s.experts[0] ?? "cto")].join("\n\n---\n\n");
  if (full.length <= maxChars) return { text: full, truncated: false };
  const cut = full.slice(0, maxChars);
  const nl = cut.lastIndexOf("\n");
  return { text: (nl > maxChars * 0.6 ? cut.slice(0, nl) : cut) + "\n…", truncated: true };
}

export function expertsFor(page: TypePage): Expert[] {
  return page.experts.map((id) => EXPERTS.find((e) => e.id === id)).filter((e): e is Expert => Boolean(e));
}

export function paymentsFor(page: TypePage) {
  return (page.payments ?? []).map((id) => PAYMENTS.find((p) => p.id === id)).filter((p): p is (typeof PAYMENTS)[number] => Boolean(p));
}

export function categoryOf(typeId: string) {
  for (const c of PROJECT_CATEGORIES) {
    const item = c.items.find((i) => i.id === typeId);
    if (item) return { cat: c.cat, label: c.cat.replace(/^[^\w]+/u, "").trim(), item };
  }
  return null;
}

/** Same-category pages first, then a couple of others — for the "related" block. */
export function relatedPages(page: TypePage, count = 6): TypePage[] {
  const cat = categoryOf(page.id)?.cat;
  const same = TYPE_PAGES.filter((p) => p.id !== page.id && categoryOf(p.id)?.cat === cat);
  const others = TYPE_PAGES.filter((p) => p.id !== page.id && categoryOf(p.id)?.cat !== cat);
  // Deterministic "rotation" so different pages link to different others.
  const offset = TYPE_PAGES.findIndex((p) => p.id === page.id);
  const rotated = [...others.slice(offset % Math.max(others.length, 1)), ...others.slice(0, offset % Math.max(others.length, 1))];
  return [...same, ...rotated].slice(0, count);
}

/** Pages grouped by PROJECT_CATEGORIES order, for the hub. */
export function pagesByCategory(): { cat: string; pages: TypePage[] }[] {
  return PROJECT_CATEGORIES.map((c) => ({
    cat: c.cat,
    pages: c.items.map((i) => TYPE_PAGES.find((p) => p.id === i.id)).filter((p): p is TypePage => Boolean(p)),
  })).filter((g) => g.pages.length > 0);
}
