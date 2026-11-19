import type { Metadata } from "next";

/** What the root layout's title template ("%s · Prompter.Monster") appends to every page title. */
export const TITLE_SUFFIX = " · Prompter.Monster";

/** Search results cut titles at roughly 600 px, about 60 characters. */
export const TITLE_MAX = 60;

/**
 * A page's <title>: with the brand suffix while the whole title still fits in TITLE_MAX characters, otherwise the
 * page's own title alone (`absolute`). A title cut off as "… · Prompter.Mon…" helps no one, and search engines
 * show the site name next to the result anyway (WebSite JSON-LD, og:site_name).
 */
export function pageTitle(base: string): NonNullable<Metadata["title"]> {
  return base.length + TITLE_SUFFIX.length <= TITLE_MAX ? base : { absolute: base };
}

/** Pages that are thin until people share something (filter pages, profiles): crawlable, not indexed while empty. */
export function robotsWhen(hasContent: boolean): NonNullable<Metadata["robots"]> {
  return hasContent ? { index: true, follow: true } : { index: false, follow: true };
}
