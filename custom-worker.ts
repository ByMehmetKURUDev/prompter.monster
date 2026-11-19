/**
 * Cloudflare Worker entry (wrangler.jsonc → "main"): OpenNext's generated fetch handler, unchanged, plus a scheduled
 * handler for the hourly cron (wrangler.jsonc → triggers.crons) that sends the lifecycle e-mails — welcome and the
 * one-time getting-started reminder (migration 0023). See https://opennext.js.org/cloudflare/howtos/custom-worker
 *
 * The cron does nothing until the RESEND_API_KEY secret exists; LIFECYCLE_EMAILS = "off" pauses it.
 */
// @ts-ignore `.open-next/worker.js` is generated at build time (opennextjs-cloudflare build)
import { default as handler } from "./.open-next/worker.js";
// @ts-ignore generated at build time: the .env.production values OpenNext embeds (NEXT_PUBLIC_SUPABASE_URL, …)
import * as nextEnv from "./.open-next/cloudflare/next-env.mjs";
import { emailConfigFrom, runLifecycleEmails } from "./src/lib/email/lifecycle";

type WorkerEnv = Record<string, unknown>;
type WorkerCtx = { waitUntil(promise: Promise<unknown>): void };

/** Same precedence as OpenNext's populateProcessEnv: worker vars and secrets win over the embedded .env values. */
function flatEnv(env: WorkerEnv): Record<string, string> {
  const mode = typeof env.NEXTJS_ENV === "string" ? env.NEXTJS_ENV : "production";
  const embedded = ((nextEnv as Record<string, unknown>)[mode] ?? {}) as Record<string, string>;
  const out: Record<string, string> = { ...embedded };
  for (const [key, value] of Object.entries(env)) if (typeof value === "string") out[key] = value;
  return out;
}

export default {
  fetch: handler.fetch,

  async scheduled(_controller: unknown, env: WorkerEnv, ctx: WorkerCtx) {
    const cfg = emailConfigFrom(flatEnv(env));
    if (!cfg) return;
    ctx.waitUntil(
      runLifecycleEmails(cfg).then(
        (results) => console.log("[cron] lifecycle emails", JSON.stringify(results)),
        (e) => console.error("[cron] lifecycle emails failed", e),
      ),
    );
  },
};
