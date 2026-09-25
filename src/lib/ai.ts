import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { clientKey, consume } from "./ratelimit";
import { createClient, supabaseConfigured } from "./supabase/server";

/** Server-only. Never import from a client component. */

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

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

/**
 * Common guard for every AI route: key present + quota.
 * Signed-in users: per-account daily quota in Supabase (free 3, pro 200).
 * Visitors: per-IP daily quota in KV (in-memory locally).
 */
export async function guard(req: Request, endpoint = "ai"): Promise<{ remaining: number; limit: number }> {
  if (!hasApiKey()) {
    throw new AiRouteError(
      503,
      "no_api_key",
      "AI özellikleri henüz açık değil: sunucuda ANTHROPIC_API_KEY tanımlı değil (Cloudflare'da `wrangler secret put ANTHROPIC_API_KEY`, yerelde .env.local).",
    );
  }

  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc("consume_ai_call", { p_endpoint: endpoint }).single<{ ok: boolean; remaining: number; plan: string }>();
        if (!error && data) {
          const limit = data.plan === "pro" ? 200 : 3;
          if (!data.ok) {
            throw new AiRouteError(
              429,
              "rate_limited",
              data.plan === "pro"
                ? `Günlük adil kullanım sınırına (${limit}) ulaştınız. Yarın devam edebilirsiniz.`
                : `Günlük ücretsiz AI hakkınız (${limit}) doldu. Yarın tekrar deneyin — Pro planda günde ${200}.`,
            );
          }
          return { remaining: data.remaining, limit };
        }
      }
    } catch (e) {
      if (e instanceof AiRouteError) throw e;
      // Supabase unreachable → fall through to the IP quota rather than blocking everyone.
    }
  }

  const r = await consume(clientKey(req));
  if (!r.ok) {
    throw new AiRouteError(
      429,
      "rate_limited",
      `Günlük ücretsiz AI hakkınız (${r.limit}) doldu. Yarın tekrar deneyin ya da giriş yapıp Pro'ya geçin.`,
    );
  }
  return r;
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof AiRouteError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  console.error("[ai]", e);
  return NextResponse.json({ error: "AI çağrısı başarısız oldu. Lütfen tekrar deneyin.", code: "ai_failed" }, { status: 500 });
}

/** One-shot text completion. */
export async function complete(system: string, user: string, maxTokens = 1024): Promise<string> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Streaming completion → ReadableStream of UTF-8 text chunks. */
export function streamText(system: string, user: string, maxTokens = 4096): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const client = anthropic();
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        });
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(enc.encode(ev.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[ai:stream]", err);
        controller.enqueue(enc.encode("\n\n[AI hatası: akış kesildi]"));
        controller.close();
      }
    },
  });
}
