/**
 * Shared logic for the public API and the MCP server: input schema → Studio state → prompts/files.
 * Pure functions (no I/O) so both transports stay in sync.
 */
import { z } from "zod";
import { ALL_PROJECT_TYPES, EMPTY_STATE, EMPTY_STATE_EN, EXPERTS, FORMATS, PAYMENTS, PROJECT_CATEGORIES } from "./data";
import { limitsFor, type PlanId } from "./plans";
import { CUSTOM_TYPE_DESCRIPTIONS } from "./catalog";
import { buildProjectFiles } from "./exports";
import { buildExpertPrompt, buildMegaHeader, buildMegaPrompt, projectTypeName } from "./prompt";
import { typePages } from "./seo-types";
import { TYPE_PRESETS, quickStartState, stackFor } from "./type-presets";
import type { OutputFormat, StudioState } from "./types";

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

const str = (max: number) => z.string().trim().max(max);
const list = (maxItems: number, maxLen = 80) => z.array(z.string().trim().max(maxLen)).max(maxItems);

export const GenerateInput = z.object({
  name: str(120).min(1),
  pitch: str(300).default(""),
  description: str(4000).default(""),
  projectType: str(40).optional(),
  audience: z.object({ role: str(200).optional(), pain: str(300).optional(), budget: str(80).optional() }).optional(),
  competitors: list(5).optional(),
  usp: str(400).optional(),
  monetization: list(6).optional(),
  stack: z
    .object({ frontend: list(4), backend: list(4), database: list(4), auth: list(3), ai: list(4), realtime: list(4), search: list(3) })
    .partial()
    .optional(),
  features: list(40).optional(),
  payments: list(8, 40).optional(),
  compliance: list(6).optional(),
  experts: list(18, 40).optional(),
  format: z.enum(FORMATS).default("Claude XML"),
  lang: z.enum(["TR", "EN"]).default("EN"),
  output: z.enum(["mega", "experts", "files"]).default("mega"),
});
export type GenerateInputT = z.infer<typeof GenerateInput>;

export class ApiInputError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Builds a full Studio state from API input, applying the project-type preset first. */
export function stateFromInput(input: GenerateInputT, plan: PlanId): { state: StudioState; notes: string[] } {
  const notes: string[] = [];
  const base0 = input.lang === "EN" ? EMPTY_STATE_EN : EMPTY_STATE;
  let base: StudioState = { ...base0 };
  if (input.projectType) {
    const preset = quickStartState(input.projectType);
    if (!preset) throw new ApiInputError("unknown_type", `Unknown projectType "${input.projectType}". Call list_project_types / GET /api/v1/types.`);
    base = { ...preset };
  }
  const limits = limitsFor(plan);
  const validExperts = new Set(EXPERTS.map((e) => e.id));
  let experts = (input.experts?.length ? input.experts : base.experts).filter((id) => validExperts.has(id));
  if (!experts.length) experts = ["cto", "pm", "design"];
  if (experts.length > limits.experts) {
    notes.push(`Free plan: ${limits.experts} experts max — kept ${experts.slice(0, limits.experts).join(", ")}. Monster Pro unlocks all 18.`);
    experts = experts.slice(0, limits.experts);
  }
  if (!limits.formats.includes(input.format as OutputFormat)) {
    throw new ApiInputError("pro_format", `The "${input.format}" format needs Monster Pro. Free formats: ${limits.formats.join(", ")}.`, 403);
  }
  const validPayments = new Set(PAYMENTS.map((p) => p.id));
  const state: StudioState = {
    ...base,
    step: 4,
    projectType: input.projectType ?? base.projectType,
    name: input.name,
    pitch: input.pitch || base.pitch,
    description: input.description || base.description,
    audience: { role: input.audience?.role ?? base.audience.role, pain: input.audience?.pain ?? base.audience.pain, budget: input.audience?.budget ?? base.audience.budget },
    competitors: input.competitors ?? base.competitors,
    usp: input.usp ?? base.usp,
    monetization: input.monetization ?? base.monetization,
    frontend: input.stack?.frontend ?? base.frontend,
    backend: input.stack?.backend ?? base.backend,
    database: input.stack?.database ?? base.database,
    auth: input.stack?.auth ?? base.auth,
    ai: input.stack?.ai ?? base.ai,
    realtime: input.stack?.realtime ?? base.realtime,
    search: input.stack?.search ?? base.search,
    features: input.features ?? base.features,
    payments: (input.payments ?? base.payments).filter((p) => validPayments.has(p)),
    compliance: input.compliance ?? base.compliance,
    experts,
    lang: input.lang,
    format: input.format as OutputFormat,
  };
  return { state, notes };
}

export function studioUrl(state: StudioState): string {
  const path = state.lang === "EN" ? "/en/studio" : "/studio";
  return `${SITE}${path}${state.projectType ? `?type=${encodeURIComponent(state.projectType)}` : ""}`;
}

export interface GenerateResult {
  plan: PlanId;
  name: string;
  projectType: string;
  projectTypeName: string;
  format: string;
  lang: string;
  experts: string[];
  header: string;
  megaPrompt?: string;
  prompts?: Record<string, string>;
  files?: Record<string, string>;
  notes: string[];
  studioUrl: string;
}

export function generate(input: GenerateInputT, plan: PlanId): GenerateResult {
  const { state, notes } = stateFromInput(input, plan);
  const res: GenerateResult = {
    plan,
    name: state.name,
    projectType: state.projectType,
    projectTypeName: projectTypeName(state.projectType),
    format: state.format,
    lang: state.lang,
    experts: state.experts,
    header: buildMegaHeader(state),
    notes,
    studioUrl: studioUrl(state),
  };
  if (input.output === "mega") res.megaPrompt = buildMegaPrompt(state);
  if (input.output === "experts") res.prompts = Object.fromEntries(state.experts.map((id) => [id, buildExpertPrompt(state, id)]));
  if (input.output === "files") res.files = exportFiles(input, plan, state);
  return res;
}

/** Pro: every project file for coding agents (AGENTS.md, CLAUDE.md, .claude/agents, Cursor rules, Copilot, Task Master, JSON). */
export function exportFiles(input: GenerateInputT, plan: PlanId, state?: StudioState): Record<string, string> {
  if (!limitsFor(plan).builders) {
    throw new ApiInputError("pro_files", "Project file exports (AGENTS.md, CLAUDE.md, .claude/agents, Cursor rules…) need Monster Pro. Use output \"mega\" on the Free plan.", 403);
  }
  return buildProjectFiles(state ?? stateFromInput(input, plan).state);
}

/** Project types for list_project_types / GET /api/v1/types. */
export function listTypes(lang: "TR" | "EN" = "EN") {
  const pages = typePages(lang === "EN" ? "en" : "tr");
  return PROJECT_CATEGORIES.flatMap((c) =>
    c.items.map((i) => {
      const page = pages.find((p) => p.id === i.id);
      return {
        id: i.id,
        name: i.name,
        category: c.cat.replace(/^[^\w]+/u, "").trim(),
        badge: i.badge || undefined,
        description: page?.description ?? CUSTOM_TYPE_DESCRIPTIONS[i.id]?.[lang === "EN" ? "en" : "tr"] ?? CUSTOM_TYPE_DESCRIPTIONS[i.id]?.en,
        url: page ? `${SITE}${lang === "EN" ? "/en" : ""}/prompt/${page.slug}` : undefined,
      };
    }),
  );
}

/** Preset for get_type_preset / GET /api/v1/types/{id}. */
export function typePreset(id: string) {
  const type = ALL_PROJECT_TYPES.find((t) => t.id === id);
  const preset = TYPE_PRESETS[id];
  if (!type || !preset) return null;
  return {
    id,
    name: type.name,
    experts: preset.experts,
    stack: stackFor(id),
    features: preset.features,
    payments: preset.payments ?? [],
    monetization: preset.monetization,
    compliance: preset.compliance ?? [],
  };
}

export const EXPERT_IDS = EXPERTS.map((e) => ({ id: e.id, role: e.role, spec: e.spec }));
