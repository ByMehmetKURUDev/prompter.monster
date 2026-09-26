import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { clientKey, consume, ipHash, refund } from "./ratelimit";
import { creditCosts, type AiEndpoint } from "./settings";
import { FALLBACK_MODEL, readServerSettings, resolveModel } from "./settings-server";
import { adminConfigured, createAdminClient } from "./supabase/admin";
import { createClient, supabaseConfigured } from "./supabase/server";

/** Server-only. Never import from a client component. */

export type { AiEndpoint };

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function anthropic(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export class AiRouteError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Lang = "tr" | "en";

/** UI language of the caller (the Studio sends x-pm-locale; API clients may send Accept-Language). */
export function requestLang(req: Request): Lang {
  const h = req.headers.get("x-pm-locale") || "";
  if (h === "en" || h === "tr") return h;
  return /^en\b/i.test(req.headers.get("accept-language") || "") ? "en" : "tr";
}

const MSG = {
  no_api_key: {
    tr: "AI özellikleri henüz açık değil (sunucuda Anthropic anahtarı tanımlı değil). Şablon üretimi çalışmaya devam eder.",
    en: "AI features are not switched on yet (no Anthropic key on the server). Prompt generation still works.",
  },
  maintenance: { tr: "Bakım modundayız; AI özellikleri kısa süreliğine kapalı.", en: "We're in maintenance mode; AI features are briefly off." },
  ai_disabled: { tr: "AI özellikleri geçici olarak kapalı. Şablon üretimi çalışmaya devam eder.", en: "AI features are temporarily off. Prompt generation still works." },
  banned: { tr: "Bu hesap askıya alınmış. Destek: hello@prompter.monster", en: "This account is suspended. Support: hello@prompter.monster" },
} as const;

function limitMessage(lang: Lang, plan: "anon" | "free" | "pro", cost: number, remaining: number, s: Record<string, unknown>, monthly: boolean): string {
  const need = cost > 1 ? (lang === "tr" ? ` Bu işlem ${cost} kredi, kalan ${remaining}.` : ` This action costs ${cost} credits; you have ${remaining} left.`) : "";
  if (plan === "pro") {
    return monthly
      ? lang === "tr"
        ? `Bu ayın ${s.pro_credits_per_month} kredisini kullandın.${need} Yeni ay başında yenilenir.`
        : `You've used this month's ${s.pro_credits_per_month} credits.${need} They renew at the start of next month.`
      : lang === "tr"
        ? `Günlük adil kullanım sınırına (${s.pro_credits_per_day} kredi) ulaştın.${need} Yarın devam edebilirsin.`
        : `You've reached today's fair-use limit (${s.pro_credits_per_day} credits).${need} Continue tomorrow.`;
  }
  if (plan === "free") {
    return lang === "tr"
      ? `Günlük ücretsiz AI kredin (${s.free_credits_per_day}) doldu.${need} Yarın yenilenir — Pro'da ayda ${s.pro_credits_per_month} kredi.`
      : `Your free daily AI credits (${s.free_credits_per_day}) are used up.${need} They renew tomorrow — Pro includes ${s.pro_credits_per_month} credits a month.`;
  }
  return lang === "tr"
    ? `Ziyaretçi AI kredin (${s.anon_credits_per_day}) doldu.${need} Ücretsiz hesap açarsan günde ${s.free_credits_per_day} kredi.`
    : `Your visitor AI credits (${s.anon_credits_per_day}) are used up.${need} A free account gets ${s.free_credits_per_day} credits a day.`;
}

/** Everything an AI route needs after the quota check. */
export interface AiContext {
  endpoint: AiEndpoint;
  plan: "anon" | "free" | "pro";
  model: string;
  cost: number;
  /** Credits left today after this call. */
  remaining: number;
  /** Daily credit limit for the plan. */
  limit: number;
  /** Pro only: credits used / available this month (after this call). */
  monthUsed: number | null;
  monthLimit: number | null;
  maxTokens: number;
  usageId: number | null;
  anonKey: string | null;
  source: string;
  lang: Lang;
}

const MAX_TOKENS: Record<AiEndpoint, number> = { enhance: 600, suggest: 700, refine: 4000 };

/**
 * Common guard for every AI route: API key, kill switches, then credits.
 * Signed-in users: credit-weighted daily (and Pro monthly) quota in Postgres (consume_ai_call).
 * Visitors: per-IP daily credits in KV; the call is also logged (hashed IP) for statistics.
 */
export async function guard(req: Request, endpoint: AiEndpoint, source = "web"): Promise<AiContext> {
  const lang = requestLang(req);
  if (!hasApiKey()) throw new AiRouteError(503, "no_api_key", MSG.no_api_key[lang]);

  const s = await readServerSettings();
  if (s.maintenance_mode) throw new AiRouteError(503, "maintenance", MSG.maintenance[lang]);
  if (!s.ai_enabled) throw new AiRouteError(503, "ai_disabled", MSG.ai_disabled[lang]);

  const cost = creditCosts(s as unknown as Parameters<typeof creditCosts>[0])[endpoint];
  const maxTokens = endpoint === "refine" ? Number(s.refine_max_tokens) || MAX_TOKENS.refine : MAX_TOKENS[endpoint];

  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .rpc("consume_ai_call", { p_endpoint: endpoint, p_credits: cost, p_source: source })
          .single<{ ok: boolean; remaining: number; plan: string; usage_id: number | null; day_limit: number; month_used: number; month_limit: number }>();
        if (!error && data) {
          if (data.plan === "banned") throw new AiRouteError(403, "banned", MSG.banned[lang]);
          if (data.plan === "disabled") throw new AiRouteError(503, "ai_disabled", MSG.ai_disabled[lang]);
          const plan = data.plan === "pro" ? "pro" : "free";
          if (!data.ok) {
            const monthly = plan === "pro" && data.month_limit > 0 && data.month_used + cost > data.month_limit;
            throw new AiRouteError(429, "rate_limited", limitMessage(lang, plan, cost, data.remaining, s, monthly));
          }
          return {
            endpoint,
            plan,
            model: await resolveModel(plan),
            cost,
            remaining: data.remaining,
            limit: data.day_limit,
            monthUsed: plan === "pro" ? data.month_used : null,
            monthLimit: plan === "pro" ? data.month_limit : null,
            maxTokens,
            usageId: data.usage_id ?? null,
            anonKey: null,
            source,
            lang,
          };
        }
      }
    } catch (e) {
      if (e instanceof AiRouteError) throw e;
      // Supabase unreachable → fall through to the visitor quota rather than blocking everyone.
    }
  }

  const limit = Number(s.anon_credits_per_day);
  const key = clientKey(req);
  const r = await consume(key, cost, limit);
  if (!r.ok) throw new AiRouteError(429, "rate_limited", limitMessage(lang, "anon", cost, r.remaining, s, false));

  let usageId: number | null = null;
  if (adminConfigured()) {
    try {
      const { data } = await createAdminClient()
        .from("ai_usage")
        .insert({ owner_id: null, ip_hash: await ipHash(req), endpoint, credits: cost, plan: "anon", status: "pending", source })
        .select("id")
        .single<{ id: number }>();
      usageId = data?.id ?? null;
    } catch {
      /* statistics only */
    }
  }
  return {
    endpoint,
    plan: "anon",
    model: await resolveModel("anon"),
    cost,
    remaining: r.remaining,
    limit,
    monthUsed: null,
    monthLimit: null,
    maxTokens,
    usageId,
    anonKey: key,
    source,
    lang,
  };
}

/** Records the real model + token counts; a failed call gives the credits back. Never throws. */
export async function finishUsage(ctx: AiContext, r: { ok: boolean; model?: string; inputTokens?: number; outputTokens?: number }): Promise<void> {
  try {
    if (!r.ok && ctx.anonKey) await refund(ctx.anonKey, ctx.cost);
    if (ctx.usageId == null || !adminConfigured()) return;
    await createAdminClient()
      .from("ai_usage")
      .update({
        status: r.ok ? "ok" : "failed",
        model: r.model ?? ctx.model,
        input_tokens: r.inputTokens ?? null,
        output_tokens: r.outputTokens ?? null,
        ...(r.ok ? {} : { credits: 0 }),
      })
      .eq("id", ctx.usageId);
  } catch (e) {
    console.error("[ai:finish]", e);
  }
}

/** Response headers that let the UI update its credit meter (also for streamed responses). */
export function creditHeaders(ctx: AiContext): Record<string, string> {
  const h: Record<string, string> = {
    "X-Credits-Cost": String(ctx.cost),
    "X-Credits-Remaining": String(ctx.remaining),
    "X-Credits-Limit": String(ctx.limit),
    "X-Plan": ctx.plan,
  };
  if (ctx.monthLimit != null) {
    h["X-Credits-Month-Used"] = String(ctx.monthUsed ?? 0);
    h["X-Credits-Month-Limit"] = String(ctx.monthLimit);
  }
  return h;
}

/** JSON body fragment with the same information. */
export function creditInfo(ctx: AiContext) {
  return { remaining: ctx.remaining, credits: { cost: ctx.cost, remaining: ctx.remaining, limit: ctx.limit, monthUsed: ctx.monthUsed, monthLimit: ctx.monthLimit, plan: ctx.plan } };
}

export function errorResponse(e: unknown, lang: Lang = "tr"): NextResponse {
  if (e instanceof AiRouteError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  if (e && typeof e === "object" && "issues" in e) {
    return NextResponse.json({ error: lang === "en" ? "Invalid request." : "Geçersiz istek.", code: "bad_request" }, { status: 400 });
  }
  console.error("[ai]", e);
  return NextResponse.json(
    { error: lang === "en" ? "The AI call failed. Your credits were not used — please try again." : "AI çağrısı başarısız oldu; kredin düşülmedi. Lütfen tekrar dene.", code: "ai_failed" },
    { status: 500 },
  );
}

/** A retired / unknown model id (404 or "model" 400) — worth one retry with the fallback model. */
function isModelError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | null;
  if (!e) return false;
  return e.status === 404 || (e.status === 400 && /model/i.test(e.message ?? ""));
}

/** One-shot completion; records usage (and refunds on failure). */
export async function complete(ctx: AiContext, system: string, user: string): Promise<string> {
  const run = (model: string) =>
    anthropic().messages.create({ model, max_tokens: ctx.maxTokens, system, messages: [{ role: "user", content: user }] });
  let model = ctx.model;
  try {
    let res: Anthropic.Message;
    try {
      res = await run(model);
    } catch (err) {
      if (!isModelError(err) || model === FALLBACK_MODEL) throw err;
      console.warn(`[ai] model ${model} unavailable, falling back to ${FALLBACK_MODEL}`);
      model = FALLBACK_MODEL;
      res = await run(model);
    }
    await finishUsage(ctx, { ok: true, model: res.model || model, inputTokens: res.usage?.input_tokens, outputTokens: res.usage?.output_tokens });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (err) {
    await finishUsage(ctx, { ok: false, model });
    throw err;
  }
}

/** Streaming completion → ReadableStream of UTF-8 text; records usage when the stream ends. */
export function streamText(ctx: AiContext, system: string, user: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const client = anthropic();
  return new ReadableStream({
    async start(controller) {
      let model = ctx.model;
      let emitted = 0;
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;
      const attempt = async (m: string) => {
        const stream = client.messages.stream({ model: m, max_tokens: ctx.maxTokens, system, messages: [{ role: "user", content: user }] });
        for await (const ev of stream) {
          if (ev.type === "message_start") inputTokens = ev.message.usage?.input_tokens;
          else if (ev.type === "message_delta") outputTokens = ev.usage?.output_tokens ?? outputTokens;
          else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            emitted += ev.delta.text.length;
            controller.enqueue(enc.encode(ev.delta.text));
          }
        }
      };
      try {
        try {
          await attempt(model);
        } catch (err) {
          if (emitted > 0 || !isModelError(err) || model === FALLBACK_MODEL) throw err;
          console.warn(`[ai:stream] model ${model} unavailable, falling back to ${FALLBACK_MODEL}`);
          model = FALLBACK_MODEL;
          await attempt(model);
        }
        await finishUsage(ctx, { ok: true, model, inputTokens, outputTokens });
        controller.close();
      } catch (err) {
        console.error("[ai:stream]", err);
        // Nothing delivered → give the credits back; a partial answer still counts.
        await finishUsage(ctx, { ok: emitted > 0, model, inputTokens, outputTokens });
        controller.enqueue(
          enc.encode(
            emitted > 0
              ? ctx.lang === "en"
                ? "\n\n[AI error: the stream was interrupted]"
                : "\n\n[AI hatası: akış kesildi]"
              : ctx.lang === "en"
                ? "[AI error: no answer was produced — your credits were returned]"
                : "[AI hatası: yanıt üretilemedi — kredin iade edildi]",
          ),
        );
        controller.close();
      }
    },
  });
}
