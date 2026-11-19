/**
 * Cloudflare Worker entry (wrangler.jsonc → "main"): OpenNext's generated fetch handler, unchanged, plus a scheduled
 * handler for the hourly cron (wrangler.jsonc → triggers.crons) that sends the lifecycle e-mails — welcome and the
 * one-time getting-started reminder (migration 0023). See https://opennext.js.org/cloudflare/howtos/custom-worker
 *
 * The cron does nothing until the RESEND_API_KEY secret exists; LIFECYCLE_EMAILS = "off" pauses it.
 * On Mondays the 05:17 UTC run (08:17 Istanbul) also e-mails the weekly admin summary (migration 0024);
 * WEEKLY_SUMMARY = "off" turns that off.
 */
// @ts-ignore `.open-next/worker.js` is generated at build time (opennextjs-cloudflare build)
import { default as handler } from "./.open-next/worker.js";
// @ts-ignore generated at build time: the .env.production values OpenNext embeds (NEXT_PUBLIC_SUPABASE_URL, …)
import * as nextEnv from "./.open-next/cloudflare/next-env.mjs";
import { emailConfigFrom, runLifecycleEmails } from "./src/lib/email/lifecycle";
import { isWeeklySlot, sendWeeklySummary, weeklyConfigFrom } from "./src/lib/email/weekly";

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

  async scheduled(controller: { scheduledTime?: number } | undefined, env: WorkerEnv, ctx: WorkerCtx) {
    const flat = flatEnv(env);
    const when = new Date(controller?.scheduledTime ?? Date.now());
    const weekly = isWeeklySlot(when) ? weeklyConfigFrom(flat) : null;
    if (weekly) {
      ctx.waitUntil(
        sendWeeklySummary(weekly, { now: when }).then(
          (result) => console.log("[cron] weekly summary", JSON.stringify(result)),
          (e) => console.error("[cron] weekly summary failed", e),
        ),
      );
    }
    const cfg = emailConfigFrom(flat);
    if (!cfg) return;
    ctx.waitUntil(
      runLifecycleEmails(cfg).then(
        (results) => console.log("[cron] lifecycle emails", JSON.stringify(results)),
        (e) => console.error("[cron] lifecycle emails failed", e),
      ),
    );
  },
};
