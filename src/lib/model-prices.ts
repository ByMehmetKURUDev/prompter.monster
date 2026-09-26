/**
 * Anthropic list prices (USD per million tokens), checked September 2026 — update when pricing changes.
 * Used by the admin usage page to turn logged token counts into real cost.
 */
export const MODEL_PRICES: { prefix: string; label: string; input: number; output: number }[] = [
  { prefix: "claude-fable-5-1", label: "Claude Fable 5.1", input: 10, output: 50 },
  { prefix: "claude-opus-5-5", label: "Claude Opus 5.5", input: 4, output: 20 },
  { prefix: "claude-sonnet-5", label: "Claude Sonnet 5", input: 2, output: 10 },
  { prefix: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", input: 3, output: 15 },
  { prefix: "claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1, output: 5 },
];

export function priceOf(model: string | null | undefined) {
  const m = (model ?? "").toLowerCase();
  return MODEL_PRICES.find((p) => m.startsWith(p.prefix)) ?? null;
}

/** USD cost of a token count on a model (null when the model's price is unknown). */
export function costUsd(model: string | null | undefined, inputTokens: number, outputTokens: number): number | null {
  const p = priceOf(model);
  if (!p) return null;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
