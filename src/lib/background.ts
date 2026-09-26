import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Runs a promise after the response without blocking it. On Cloudflare Workers an un-awaited promise can be
 * cancelled once the response is sent, so it is handed to ctx.waitUntil; elsewhere it simply runs.
 * Accepts PromiseLike so Supabase query builders (thenables) can be passed directly. Never throws.
 */
export function background(work: PromiseLike<unknown>): void {
  const safe = Promise.resolve(work).then(
    () => undefined,
    (e) => console.error("[background]", e),
  );
  try {
    const { ctx } = getCloudflareContext() as unknown as { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
    if (ctx?.waitUntil) {
      ctx.waitUntil(safe);
      return;
    }
  } catch {
    /* not on Cloudflare (next dev / next start) */
  }
  void safe;
}
