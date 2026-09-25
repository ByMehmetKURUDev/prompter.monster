import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { clientKey, consume } from "./ratelimit";

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

/** Common guard for every AI route: key present + rate limit. */
export async function guard(req: Request): Promise<{ remaining: number; limit: number }> {
  if (!hasApiKey()) {
    throw new AiRouteError(
      503,
      "no_api_key",
      "AI özellikleri kapalı: sunucuda ANTHROPIC_API_KEY tanımlı değil. .env.local dosyasına ekleyin.",
    );
  }
  const r = await consume(clientKey(req));
  if (!r.ok) {
    throw new AiRouteError(
      429,
      "rate_limited",
      `Günlük ücretsiz AI hakkınız (${r.limit}) doldu. Yarın tekrar deneyin — Pro planda sınırsız.`,
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
