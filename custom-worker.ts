/**
 * Cloudflare Worker entry (wrangler.jsonc → "main"): OpenNext's generated fetch handler (www → canonical host 301,
 * English HTML pages get <html lang="en">; see canonicalHostRedirect and withPageLang), plus a scheduled
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

/** Workers runtime global (workerd); declared here because the project does not load @cloudflare/workers-types. */
interface LangRewriter {
  on(selector: string, handlers: { element(el: { setAttribute(name: string, value: string): void }): void }): LangRewriter;
  transform(response: Response): Response;
}
declare const HTMLRewriter: { new (): LangRewriter };

/**
 * One root layout serves both languages and renders <html lang="tr">. Browsers already switch /en pages to "en"
 * (inline script in app/en/layout.tsx), but crawlers, link previews and validators read the raw HTML, so English
 * HTML documents get the attribute rewritten here as well. RSC payloads and other content types pass through.
 */
function withPageLang(request: Request, response: Response): Response {
  const { pathname } = new URL(request.url);
  if (pathname !== "/en" && !pathname.startsWith("/en/")) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html") || !response.body) return response;
  return new HTMLRewriter()
    .on("html", {
      element(el) {
        el.setAttribute("lang", "en");
      },
    })
    .transform(response);
}
type WorkerCtx = { waitUntil(promise: Promise<unknown>): void };

/**
 * www.prompter.monster is routed to this Worker too (wrangler.jsonc → routes). Page visits there get a 301 to the
 * canonical host (NEXT_PUBLIC_SITE_URL): one site for search engines and one login session (Supabase only sends
 * sign-in links back to the canonical host). /api/ is left alone: webhooks and MCP clients don't follow redirects.
 */
function canonicalHostRedirect(request: Request, env: WorkerEnv): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  let canonical: URL;
  try {
    canonical = new URL(String(env.NEXT_PUBLIC_SITE_URL || ""));
  } catch {
    return null;
  }
  const url = new URL(request.url);
  if (url.hostname !== `www.${canonical.hostname}` || url.pathname.startsWith("/api/")) return null;
  url.protocol = canonical.protocol;
  url.host = canonical.host;
  return Response.redirect(url.toString(), 301);
}

/** Same precedence as OpenNext's populateProcessEnv: worker vars and secrets win over the embedded .env values. */
function flatEnv(env: WorkerEnv): Record<string, string> {
  const mode = typeof env.NEXTJS_ENV === "string" ? env.NEXTJS_ENV : "production";
  const embedded = ((nextEnv as Record<string, unknown>)[mode] ?? {}) as Record<string, string>;
  const out: Record<string, string> = { ...embedded };
  for (const [key, value] of Object.entries(env)) if (typeof value === "string") out[key] = value;
  return out;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: WorkerCtx): Promise<Response> {
    const redirect = canonicalHostRedirect(request, env);
    if (redirect) return redirect;
    return withPageLang(request, await handler.fetch(request, env, ctx));
  },

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
