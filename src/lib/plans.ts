import type { OutputFormat } from "./types";

/** Plan entitlements. Enforced in the Studio UI and, for AI calls, by `consume_ai_call` in the database. */
export type PlanId = "free" | "pro";

export interface PlanLimits {
  /** Max experts selectable per generation. */
  experts: number;
  /** Output formats available in Step 4. */
  formats: OutputFormat[];
  /** 8-step Mega Chain view + one-shot master prompt. */
  megaChain: boolean;
  /** "Export to Builders" (Cursor/Windsurf/v0/Lovable/Bolt) and .cursorrules / CLAUDE.md downloads. */
  builders: boolean;
  /** Daily AI calls (informational; the database enforces the real quota). */
  aiPerDay: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { experts: 3, formats: ["ChatGPT Markdown", "Claude XML"], megaChain: false, builders: false, aiPerDay: 3 },
  pro: { experts: 12, formats: ["ChatGPT Markdown", "Claude XML", "Cursor Rules", "v0", "Lovable/Bolt"], megaChain: true, builders: true, aiPerDay: 200 },
};

export function limitsFor(plan: PlanId | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan === "pro" ? "pro" : "free"];
}

export function formatAllowed(plan: PlanId | null | undefined, format: OutputFormat): boolean {
  return limitsFor(plan).formats.includes(format);
}

/** Exports that need Pro. */
export const PRO_EXPORTS = new Set(["cursorrules", "claude"]);

export const UPGRADE_HINT = "Pro'ya geç: 12 uzman, Mega Chain, 5 format ve Export to Builders — /pricing";
