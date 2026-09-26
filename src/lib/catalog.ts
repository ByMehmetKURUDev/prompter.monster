/**
 * Live catalog: experts and project types editable from /admin/catalog without a deploy.
 *
 * The built-in data (data.ts, type-presets.ts) stays the default. Rows from `catalog_items` are applied on top by
 * mutating the exported arrays/maps in place, so every consumer (Studio, prompt builder, API, MCP) sees the same
 * catalog without being rewritten:
 *   - a row with a built-in id overrides fields of that item, or hides it (enabled = false);
 *   - a row with a new id adds an expert / project type.
 * Client- and server-safe (no I/O here). Server: catalog-server.ts; browser: /api/catalog + useCatalog().
 */
import { z } from "zod";
import { EXPERTS, PAYMENTS, PROJECT_CATEGORIES, ALL_PROJECT_TYPES, STACK_SUGGESTIONS } from "./data";
import { TYPE_PRESETS, type TypePreset } from "./type-presets";
import type { Badge, Expert, ProjectType } from "./types";

export type CatalogKind = "expert" | "project_type";

export interface CatalogRow {
  kind: CatalogKind;
  id: string;
  data: Record<string, unknown>;
  enabled: boolean;
  sort: number;
  updated_at?: string;
}

export const CATALOG_ID_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;

const text = (max: number) => z.string().trim().max(max);
const list = (maxItems: number, maxLen = 80) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

/** Fields an expert row may carry (all optional for overrides; role/spec/task required for a new expert — see validate). */
export const ExpertData = z.object({
  emoji: text(8).optional(),
  role: text(60).optional(),
  org: text(60).optional(),
  spec: text(60).optional(),
  years: z.number().int().min(1).max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  task: text(1200).optional(),
  taskEn: text(1200).optional(),
});
export type ExpertDataT = z.infer<typeof ExpertData>;

export const ProjectTypeData = z.object({
  name: text(60).optional(),
  icon: text(8).optional(),
  badge: z.enum(["", "NEW", "HOT"]).optional(),
  /** Category label, e.g. "🚀 STARTUP" — an unknown label creates a new category. */
  category: text(40).optional(),
  description: z.object({ tr: text(300).optional(), en: text(300).optional() }).optional(),
  experts: list(18, 40).optional(),
  features: list(40).optional(),
  stack: list(12).optional(),
  payments: list(8, 40).optional(),
  monetization: list(6).optional(),
  compliance: list(6).optional(),
});
export type ProjectTypeDataT = z.infer<typeof ProjectTypeData>;

/* ───────── built-in snapshot (taken once, before any catalog is applied) ───────── */

const BUILTIN_EXPERTS: Expert[] = EXPERTS.map((e) => ({ ...e }));
const BUILTIN_CATEGORIES = PROJECT_CATEGORIES.map((c) => ({ cat: c.cat, items: c.items.map((i) => ({ ...i })) }));
const BUILTIN_PRESETS: Record<string, TypePreset> = Object.fromEntries(Object.entries(TYPE_PRESETS).map(([k, v]) => [k, { ...v }]));
const BUILTIN_STACKS: Record<string, string[]> = { ...STACK_SUGGESTIONS };

export const BUILTIN_EXPERT_IDS = new Set(BUILTIN_EXPERTS.map((e) => e.id));
export const BUILTIN_TYPE_IDS = new Set(BUILTIN_CATEGORIES.flatMap((c) => c.items.map((i) => i.id)));

export function builtinExpert(id: string): Expert | undefined {
  return BUILTIN_EXPERTS.find((e) => e.id === id);
}
export function builtinType(id: string): { type: ProjectType; category: string; preset?: TypePreset; stack?: string[] } | undefined {
  for (const c of BUILTIN_CATEGORIES) {
    const t = c.items.find((i) => i.id === id);
    if (t) return { type: t, category: c.cat, preset: BUILTIN_PRESETS[id], stack: BUILTIN_STACKS[id] };
  }
  return undefined;
}
export const BUILTIN_CATEGORY_LABELS = BUILTIN_CATEGORIES.map((c) => c.cat);

/** Built-in experts as shipped in code (unaffected by the applied catalog) — for the admin editor. */
export function builtinExperts(): Expert[] {
  return BUILTIN_EXPERTS.map((e) => ({ ...e }));
}

/** Built-in project types with their category, preset and stack — for the admin editor. */
export function builtinTypes(): { type: ProjectType; category: string; preset?: TypePreset; stack?: string[] }[] {
  return BUILTIN_CATEGORIES.flatMap((c) => c.items.map((t) => ({ type: { ...t }, category: c.cat, preset: BUILTIN_PRESETS[t.id], stack: BUILTIN_STACKS[t.id] })));
}

/** One-line descriptions of catalog-added project types (built-ins have their SEO page copy). */
export const CUSTOM_TYPE_DESCRIPTIONS: Record<string, { tr?: string; en?: string }> = {};

let appliedKey = "";

function clean<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const r = schema.safeParse(data ?? {});
  return r.success ? r.data : null;
}

/** New experts need the essentials; overrides may carry any subset. */
function expertFromRow(r: CatalogRow): Expert | null {
  const d = clean(ExpertData, r.data);
  if (!d || !d.role || !d.task) return null;
  return {
    id: r.id,
    emoji: d.emoji || "🧠",
    role: d.role,
    org: d.org || "",
    spec: d.spec || d.role,
    years: d.years ?? 8,
    color: d.color || "#A3FF12",
    task: d.task,
    taskEn: d.taskEn || undefined,
  };
}

/**
 * Applies catalog rows on top of the built-ins (idempotent; a no-op when the rows did not change).
 * Returns true when something changed, so a React caller can re-render.
 */
export function applyCatalog(rows: CatalogRow[]): boolean {
  const key = JSON.stringify(rows.map((r) => [r.kind, r.id, r.enabled, r.sort, r.updated_at ?? "", r.updated_at ? "" : r.data]));
  if (key === appliedKey) return false;
  appliedKey = key;

  const bySort = (a: CatalogRow, b: CatalogRow) => a.sort - b.sort || a.id.localeCompare(b.id);
  const expertRows = new Map(rows.filter((r) => r.kind === "expert").map((r) => [r.id, r]));
  const typeRows = new Map(rows.filter((r) => r.kind === "project_type").map((r) => [r.id, r]));

  /* experts */
  const experts: Expert[] = [];
  for (const b of BUILTIN_EXPERTS) {
    const r = expertRows.get(b.id);
    if (r && !r.enabled) continue;
    const d = r ? clean(ExpertData, r.data) : null;
    experts.push(d ? { ...b, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== "")) } : { ...b });
  }
  for (const r of [...expertRows.values()].filter((x) => x.enabled && !BUILTIN_EXPERT_IDS.has(x.id)).sort(bySort)) {
    const e = expertFromRow(r);
    if (e) experts.push(e);
  }
  EXPERTS.splice(0, EXPERTS.length, ...experts);
  const expertIds = new Set(experts.map((e) => e.id));

  /* project types + presets + stacks */
  for (const k of Object.keys(TYPE_PRESETS)) if (!(k in BUILTIN_PRESETS)) delete TYPE_PRESETS[k];
  for (const [k, v] of Object.entries(BUILTIN_PRESETS)) TYPE_PRESETS[k] = { ...v };
  for (const k of Object.keys(STACK_SUGGESTIONS)) if (!(k in BUILTIN_STACKS)) delete STACK_SUGGESTIONS[k];
  for (const [k, v] of Object.entries(BUILTIN_STACKS)) STACK_SUGGESTIONS[k] = [...v];
  for (const k of Object.keys(CUSTOM_TYPE_DESCRIPTIONS)) delete CUSTOM_TYPE_DESCRIPTIONS[k];

  const cats = BUILTIN_CATEGORIES.map((c) => ({ cat: c.cat, items: [] as ProjectType[] }));
  const catOf = (label: string) => {
    let c = cats.find((x) => x.cat === label);
    if (!c) {
      c = { cat: label, items: [] };
      cats.push(c);
    }
    return c;
  };
  const validPayments = new Set(PAYMENTS.map((p) => p.id));
  const applyPreset = (id: string, d: ProjectTypeDataT, base?: TypePreset) => {
    const preset: TypePreset = {
      experts: (d.experts ?? base?.experts ?? ["cto", "pm", "design"]).filter((e) => expertIds.has(e)),
      features: d.features ?? base?.features ?? [],
      payments: (d.payments ?? base?.payments ?? []).filter((p) => validPayments.has(p)),
      monetization: d.monetization ?? base?.monetization ?? [],
      compliance: d.compliance ?? base?.compliance ?? [],
    };
    TYPE_PRESETS[id] = preset;
    if (d.stack?.length) STACK_SUGGESTIONS[id] = d.stack;
  };

  for (const c of BUILTIN_CATEGORIES) {
    for (const t of c.items) {
      const r = typeRows.get(t.id);
      if (r && !r.enabled) {
        delete TYPE_PRESETS[t.id];
        continue;
      }
      const d = r ? clean(ProjectTypeData, r.data) : null;
      const item: ProjectType = d
        ? { ...t, name: d.name || t.name, icon: d.icon || t.icon, badge: (d.badge ?? t.badge) as Badge }
        : { ...t };
      catOf(d?.category || c.cat).items.push(item);
      if (d) applyPreset(t.id, d, BUILTIN_PRESETS[t.id]);
      // Built-in presets reference built-in experts; drop any the catalog has hidden.
      if (TYPE_PRESETS[t.id]) TYPE_PRESETS[t.id] = { ...TYPE_PRESETS[t.id], experts: TYPE_PRESETS[t.id].experts.filter((e) => expertIds.has(e)) };
    }
  }
  for (const r of [...typeRows.values()].filter((x) => x.enabled && !BUILTIN_TYPE_IDS.has(x.id)).sort(bySort)) {
    const d = clean(ProjectTypeData, r.data);
    if (!d || !d.name) continue;
    catOf(d.category || "✨ CUSTOM").items.push({ id: r.id, name: d.name, icon: d.icon || "✨", badge: (d.badge ?? "NEW") as Badge });
    applyPreset(r.id, d);
    if (d.description) CUSTOM_TYPE_DESCRIPTIONS[r.id] = d.description;
  }

  PROJECT_CATEGORIES.splice(0, PROJECT_CATEGORIES.length, ...cats.filter((c) => c.items.length));
  ALL_PROJECT_TYPES.splice(0, ALL_PROJECT_TYPES.length, ...PROJECT_CATEGORIES.flatMap((c) => c.items));
  return true;
}

/** Expert ids that still exist (a saved project may reference one the catalog has since hidden). */
export function knownExperts(ids: string[]): string[] {
  return ids.filter((id) => EXPERTS.some((e) => e.id === id));
}
