/**
 * Lifecycle e-mail sender (migration 0023): asks the database who is due (email_claim), sends through Resend, records
 * the outcome (email_finish). Used by the hourly cron (custom-worker.ts), by the auth callback right after sign-in
 * (welcome without waiting for the cron) and by Admin → E-postalar.
 *
 * Plain fetch only — no supabase-js, Next or "@/" imports — so the cron entry can bundle it outside Next. The feature
 * is off until RESEND_API_KEY exists (emailConfigFrom returns null); LIFECYCLE_EMAILS = "off" pauses it.
 */
import { EMAIL_KINDS, renderLifecycleEmail, type EmailKind, type EmailLocale } from "./templates";

export interface EmailConfig {
  supabaseUrl: string;
  serviceKey: string;
  resendKey: string;
  siteUrl: string;
  from: string;
  replyTo: string | null;
}

export interface ClaimRow {
  log_id: number;
  user_id: string;
  email: string;
  name: string | null;
  locale: EmailLocale;
  token: string;
  attempt: number;
}

export interface KindResult {
  kind: EmailKind;
  claimed: number;
  sent: number;
  failed: number;
  errors: string[];
}

export interface SendOutcome {
  ok: boolean;
  id?: string;
  error?: string;
}

const RESEND_URL = "https://api.resend.com/emails";
/** Resend's default rate limit is a few requests per second per team; stay under it. */
const SEND_GAP_MS = 550;

function str(env: Record<string, unknown>, key: string): string {
  const v = env[key];
  return typeof v === "string" ? v.trim() : "";
}

/** Reads the config from a flat env record (process.env in Next, worker bindings in the cron). Null → feature off. */
export function emailConfigFrom(env: Record<string, unknown>): EmailConfig | null {
  if (str(env, "LIFECYCLE_EMAILS").toLowerCase() === "off") return null;
  const supabaseUrl = str(env, "NEXT_PUBLIC_SUPABASE_URL") || str(env, "SUPABASE_URL");
  const serviceKey = str(env, "SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = str(env, "RESEND_API_KEY");
  if (!supabaseUrl || !serviceKey || !resendKey) return null;
  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceKey,
    resendKey,
    siteUrl: (str(env, "NEXT_PUBLIC_SITE_URL") || "https://prompter.monster").replace(/\/$/, ""),
    from: str(env, "EMAIL_FROM") || "Prompt.Monster <hello@prompter.monster>",
    replyTo: str(env, "EMAIL_REPLY_TO") || null,
  };
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Calls a Postgres function through PostgREST with the service-role key. */
export async function emailRpc<T>(cfg: Pick<EmailConfig, "supabaseUrl" | "serviceKey">, fn: string, args: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`${fn}: HTTP ${r.status} ${body.slice(0, 200)}`);
  return (body ? JSON.parse(body) : null) as T;
}

/**
 * Sends one e-mail through Resend. The idempotency key (24 h at Resend) makes a retry after a lost response safe:
 * the same request returns the original result; a 409 for a changed payload means it already went out.
 */
export async function sendViaResend(
  cfg: EmailConfig,
  msg: { to: string; subject: string; html: string; text: string; oneClickUrl?: string; tags: Record<string, string>; idempotencyKey: string },
): Promise<SendOutcome> {
  const headers: Record<string, string> = {};
  if (msg.oneClickUrl) {
    headers["List-Unsubscribe"] = `<${msg.oneClickUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const r = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.resendKey}`, "Content-Type": "application/json", "Idempotency-Key": msg.idempotencyKey },
    body: JSON.stringify({
      from: cfg.from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(cfg.replyTo ? { reply_to: cfg.replyTo } : {}),
      headers,
      tags: Object.entries(msg.tags).map(([name, value]) => ({ name, value })),
    }),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; name?: string; message?: string };
  if (r.ok && j.id) return { ok: true, id: j.id };
  if (r.status === 409 && j.name === "invalid_idempotent_request") return { ok: true, error: "idempotent duplicate: already sent" };
  return { ok: false, error: `Resend HTTP ${r.status}${j.name ? ` ${j.name}` : ""}${j.message ? `: ${j.message}` : ""}`.slice(0, 300) };
}

/** Renders and sends one claimed lifecycle e-mail. */
export async function sendLifecycle(cfg: EmailConfig, kind: EmailKind, row: Pick<ClaimRow, "user_id" | "email" | "name" | "locale" | "token">): Promise<SendOutcome> {
  const mail = renderLifecycleEmail(kind, { name: row.name, locale: row.locale === "en" ? "en" : "tr", token: row.token }, cfg.siteUrl);
  return sendViaResend(cfg, {
    to: row.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    oneClickUrl: mail.oneClickUrl,
    tags: { category: "lifecycle", kind, locale: row.locale === "en" ? "en" : "tr" },
    idempotencyKey: `lifecycle-${kind}/${row.user_id}`,
  });
}

export interface RunOptions {
  kinds?: EmailKind[];
  /** Only this user (right after sign-in). */
  userId?: string;
  /** Language of the page the user signed in from; stored when they have no preference yet. */
  locale?: EmailLocale;
  /** Per kind, 1–100 (default 25). */
  limit?: number;
}

/** Claims what is due, sends it and records each outcome. Never throws; errors are returned per kind. */
export async function runLifecycleEmails(cfg: EmailConfig, opts: RunOptions = {}): Promise<KindResult[]> {
  const results: KindResult[] = [];
  for (const kind of opts.kinds ?? EMAIL_KINDS) {
    const res: KindResult = { kind, claimed: 0, sent: 0, failed: 0, errors: [] };
    results.push(res);
    let rows: ClaimRow[];
    try {
      rows =
        (await emailRpc<ClaimRow[]>(cfg, "email_claim", {
          p_kind: kind,
          p_limit: opts.limit ?? 25,
          p_user: opts.userId ?? null,
          p_locale: opts.locale ?? null,
        })) ?? [];
    } catch (e) {
      res.errors.push(message(e));
      continue;
    }
    res.claimed = rows.length;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) await sleep(SEND_GAP_MS);
      const row = rows[i];
      let out: SendOutcome;
      try {
        out = await sendLifecycle(cfg, kind, row);
      } catch (e) {
        out = { ok: false, error: message(e).slice(0, 300) };
      }
      try {
        await emailRpc(cfg, "email_finish", { p_log_id: row.log_id, p_ok: out.ok, p_provider_id: out.id ?? null, p_error: out.error ?? null });
      } catch (e) {
        res.errors.push(`email_finish ${row.log_id}: ${message(e)}`);
      }
      if (out.ok) res.sent++;
      else {
        res.failed++;
        if (out.error) res.errors.push(out.error);
      }
    }
  }
  return results;
}
