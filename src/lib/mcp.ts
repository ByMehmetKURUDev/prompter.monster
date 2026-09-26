/**
 * Prompt.Monster MCP server — tool catalogue and JSON-RPC dispatcher (transport: /api/mcp, Streamable HTTP, stateless).
 * Every tool reuses api-core / ai, so the Studio, the REST API and MCP always produce the same prompts.
 */
import { z } from "zod";
import { AiRouteError, complete, guard } from "./ai";
import { REFINE_SYSTEM, refineUserMessage } from "./ai-prompts";
import { ApiInputError, EXPERT_IDS, GenerateInput, SITE, exportFiles, generate, listTypes, typePreset, type GenerateInputT } from "./api-core";
import type { ApiIdentity } from "./api-keys";
import { COMPLIANCE, EXPERTS, FORMATS, MONETIZATION, PAYMENTS, PROJECT_CATEGORIES } from "./data";
import { getShared } from "./share";

export const MCP_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const MCP_SERVER_INFO = { name: "prompt-monster", title: "Prompt.Monster", version: "4.4.0", websiteUrl: `${SITE}/developers` };
const KEYS_URL = `${SITE}/account/api`;

export const MCP_INSTRUCTIONS = [
  "Prompt.Monster turns a product idea into a production-grade master build prompt for AI coding tools (Claude Code, Cursor, v0, Lovable, Bolt, ChatGPT).",
  "Typical flow: list_project_types → pick the closest projectType → generate_build_prompt (free, deterministic, no AI credits) → export_files for CLAUDE.md / AGENTS.md / .cursorrules (Monster Pro) → optionally refine_prompt (spends AI credits, needs an API key).",
  "Fill name, a one-line pitch and a 100–200 word description; pass 5–12 concrete v1 features; name the audience's role and pain. Leave stack/experts empty to use the project type's presets.",
  `Without an API key the Free plan applies (3 experts, ChatGPT Markdown or Claude XML, no file exports). Keys: ${KEYS_URL}`,
].join("\n");

/* ───────────── JSON-RPC types ───────────── */

type Id = string | number | null;
export interface RpcRequest {
  jsonrpc: "2.0";
  id?: Id;
  method: string;
  params?: Record<string, unknown>;
}
export type RpcResponse = { jsonrpc: "2.0"; id: Id; result: unknown } | { jsonrpc: "2.0"; id: Id; error: { code: number; message: string; data?: unknown } };

export const rpcResult = (id: Id, result: unknown): RpcResponse => ({ jsonrpc: "2.0", id, result });
export const rpcError = (id: Id, code: number, message: string, data?: unknown): RpcResponse => ({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } });

export function isRequest(m: unknown): m is RpcRequest & { id: Id } {
  return Boolean(m && typeof m === "object" && (m as RpcRequest).jsonrpc === "2.0" && typeof (m as RpcRequest).method === "string" && "id" in (m as object));
}
export function isNotification(m: unknown): m is RpcRequest {
  return Boolean(m && typeof m === "object" && (m as RpcRequest).jsonrpc === "2.0" && typeof (m as RpcRequest).method === "string" && !("id" in (m as object)));
}

/* ───────────── Tools ───────────── */

interface TextContent {
  type: "text";
  text: string;
}
export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}
export interface ToolCtx {
  req: Request;
  identity: ApiIdentity | null;
  /** Set when the per-minute limit refused this request (tools/call only). */
  rateLimited?: string;
}
interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { title: string; readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  run: (args: Record<string, unknown>, ctx: ToolCtx) => Promise<ToolResult>;
}

const text = (t: string): TextContent => ({ type: "text", text: t });
const ok = (...blocks: string[]): ToolResult => ({ content: blocks.map(text) });
const fail = (msg: string): ToolResult => ({ content: [text(msg)], isError: true });

const strArr = (description: string, maxItems: number, items: Record<string, unknown> = { type: "string" }) => ({ type: "array", items, maxItems, description });

const STACK_SCHEMA = {
  type: "object",
  description: "Tech stack per layer (omit to use the project type's suggestion).",
  properties: {
    frontend: strArr("e.g. Next.js 15, Tailwind, shadcn/ui", 4),
    backend: strArr("e.g. Next.js Route Handlers, Hono", 4),
    database: strArr("e.g. Supabase Postgres", 4),
    auth: strArr("e.g. Supabase Auth, Clerk", 3),
    ai: strArr("e.g. Claude Sonnet 5, OpenAI embeddings", 4),
    realtime: strArr("Realtime / infra, e.g. Cloudflare Workers, Upstash", 4),
    search: strArr("e.g. pgvector, Algolia", 3),
  },
};

/** JSON Schema mirroring api-core's GenerateInput (kept by hand so descriptions can guide the model). Also used by the OpenAPI spec. */
export function generateSchema(withOutput: boolean, outputs: string[] = ["mega", "experts"]) {
  return {
    type: "object",
    properties: {
      name: { type: "string", description: "Product name.", maxLength: 120 },
      pitch: { type: "string", description: "One-line pitch (what + for whom + outcome), ≤300 chars.", maxLength: 300 },
      description: { type: "string", description: "What the product does, 100–200 words: core loop, key screens, what makes v1 done.", maxLength: 4000 },
      projectType: { type: "string", description: "Project type id from list_project_types (applies stack, feature, expert and payment presets)." },
      audience: {
        type: "object",
        description: "Target user.",
        properties: {
          role: { type: "string", description: "Who, e.g. 'freelance designers in the EU'" },
          pain: { type: "string", description: "The problem in their words" },
          budget: { type: "string", description: "e.g. '$10–30/mo'" },
        },
      },
      competitors: strArr("Up to 5 competitors or alternatives.", 5),
      usp: { type: "string", description: "Why this wins against the competitors.", maxLength: 400 },
      monetization: strArr(`Revenue model(s), e.g. ${MONETIZATION.slice(0, 3).join(", ")}.`, 6),
      stack: STACK_SCHEMA,
      features: strArr("5–12 concrete v1 features, one per item.", 40),
      payments: strArr("Payment provider ids.", 8, { type: "string", enum: PAYMENTS.map((p) => p.id) }),
      compliance: strArr(`Compliance needs, e.g. ${COMPLIANCE.join(", ")}.`, 6),
      experts: strArr("Expert ids (see list_experts). Free plan: first 3 are kept; Pro: up to 18. Omit to use the project type's picks.", 18, {
        type: "string",
        enum: EXPERTS.map((e) => e.id),
      }),
      format: { type: "string", enum: [...FORMATS], default: "Claude XML", description: "Output format. Free: ChatGPT Markdown, Claude XML. Pro: all five." },
      lang: { type: "string", enum: ["EN", "TR"], default: "EN", description: "Output language." },
      ...(withOutput
        ? {
            output: {
              type: "string",
              enum: outputs,
              default: "mega",
              description: `mega = one master prompt; experts = one prompt per expert${outputs.includes("files") ? "; files = project files for coding agents (Pro)" : ""}.`,
            },
          }
        : {}),
    },
    required: ["name"],
  };
}

function parseGenerate(args: Record<string, unknown>, output: "mega" | "experts" | "files"): GenerateInputT | string {
  const parsed = GenerateInput.safeParse({ ...args, output });
  if (!parsed.success) return `Invalid arguments — ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`;
  return parsed.data;
}

const CATEGORY_NAMES = PROJECT_CATEGORIES.map((c) => c.cat.replace(/^[^\w]+/u, "").trim());

const TOOLS: ToolDef[] = [
  {
    name: "list_project_types",
    title: "List project types",
    description: "Lists Prompt.Monster's project types (id, name, category, one-line description). Pick the closest id and pass it as projectType to generate_build_prompt.",
    inputSchema: {
      type: "object",
      properties: {
        lang: { type: "string", enum: ["EN", "TR"], default: "EN", description: "Language of names and descriptions." },
        category: { type: "string", enum: CATEGORY_NAMES, description: "Optional category filter." },
      },
    },
    annotations: { title: "List project types", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run(args) {
      const lang = String(args.lang ?? "EN").toUpperCase() === "TR" ? "TR" : "EN";
      const q = typeof args.category === "string" ? args.category.toLowerCase() : "";
      const rows = listTypes(lang).filter((t) => !q || t.category.toLowerCase().includes(q));
      if (!rows.length) return fail(`No project types match "${args.category}". Categories: ${CATEGORY_NAMES.join(", ")}`);
      return ok(rows.map((t) => `- ${t.id}: ${t.name} (${t.category})${t.description ? ` — ${t.description}` : ""}`).join("\n"));
    },
  },
  {
    name: "get_type_preset",
    title: "Get a project type's preset",
    description: "Returns the preset the Studio applies for a project type: recommended experts, tech stack, v1 features, payments, monetization and compliance.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Project type id from list_project_types." } }, required: ["id"] },
    annotations: { title: "Get a project type's preset", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run(args) {
      const id = String(args.id ?? "");
      const preset = typePreset(id);
      if (!preset) return fail(`Unknown project type "${id}". Call list_project_types first.`);
      return ok(JSON.stringify(preset, null, 2));
    },
  },
  {
    name: "list_experts",
    title: "List expert personas",
    description: "Lists the 18 expert personas (id, role, speciality) that write sections of the build prompt. Free plan: 3 experts per prompt, Pro: all 18.",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "List expert personas", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run() {
      return ok(EXPERT_IDS.map((e) => `- ${e.id}: ${e.role} — ${e.spec}`).join("\n"));
    },
  },
  {
    name: "generate_build_prompt",
    title: "Generate a master build prompt",
    description:
      "Builds a production-grade master build prompt from a product idea (PRD, architecture, data model, UX, security, payments, launch — written by expert personas). Deterministic and free: no AI credits. Paste the result into Claude Code, Cursor, v0, Lovable or ChatGPT, or start building from it.",
    inputSchema: generateSchema(true),
    annotations: { title: "Generate a master build prompt", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run(args, ctx) {
      const input = parseGenerate(args, args.output === "experts" ? "experts" : "mega");
      if (typeof input === "string") return fail(input);
      const r = generate(input, ctx.identity?.plan ?? "free");
      const meta = [
        `Plan: ${r.plan} · Type: ${r.projectTypeName} · Format: ${r.format} · Language: ${r.lang} · Experts: ${r.experts.join(", ")}`,
        ...r.notes.map((n) => `Note: ${n}`),
        `Edit in the Studio: ${r.studioUrl}`,
      ].join("\n");
      if (r.prompts) return ok(...Object.entries(r.prompts).map(([id, p]) => `### Expert: ${id}\n\n${p}`), meta);
      return ok(r.megaPrompt ?? "", meta);
    },
  },
  {
    name: "export_files",
    title: "Export project files (Pro)",
    description:
      "Monster Pro: returns ready-to-save project files for coding agents — CLAUDE.md, AGENTS.md, .cursorrules, .github/copilot-instructions.md, .claude/agents/*.md (one subagent per expert), .taskmaster/docs/prd.txt and prompt-monster.json. Write each file to the repository root at the given path.",
    inputSchema: generateSchema(false),
    annotations: { title: "Export project files (Pro)", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run(args, ctx) {
      if (!ctx.identity) return fail(`export_files needs Monster Pro and an API key. Add "Authorization: Bearer pm_live_…" to the MCP config — keys: ${KEYS_URL}`);
      if (ctx.identity.plan !== "pro") return fail(`export_files is a Monster Pro feature. Upgrade at ${SITE}/pricing — generate_build_prompt stays free.`);
      const input = parseGenerate(args, "files");
      if (typeof input === "string") return fail(input);
      const files = exportFiles(input, ctx.identity.plan);
      return ok(
        `${Object.keys(files).length} files — save each at the path shown (relative to the repository root):`,
        ...Object.entries(files).map(([path, body]) => `=== FILE: ${path} ===\n${body}`),
      );
    },
  },
  {
    name: "get_shared_prompt",
    title: "Get a shared prompt",
    description: `Fetches a prompt someone shared on Prompt.Monster (${SITE}/p/<slug>) — pass the slug or the full URL.`,
    inputSchema: { type: "object", properties: { slug: { type: "string", description: "Share slug or URL, e.g. 'ai-invoice-app-x1y2'." } }, required: ["slug"] },
    annotations: { title: "Get a shared prompt", readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async run(args) {
      const raw = String(args.slug ?? "").trim();
      const slug = raw.replace(/^.*\/p\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
      const s = await getShared(slug);
      if (!s) return fail(`No shared prompt found for "${raw}".`);
      return ok(s.output, `Shared prompt "${s.name}" v${s.version} · ${s.format} · ${s.lang} · experts: ${(s.experts ?? []).join(", ")} · ${SITE}/p/${s.slug}`);
    },
  },
  {
    name: "refine_prompt",
    title: "Refine a prompt with Claude (credits)",
    description:
      "Claude rewrites a build prompt into a strictly better version (same structure; adds acceptance criteria, edge cases, non-functional requirements). Needs an API key; spends 3 AI credits from the key owner's plan (Free: 5/day, Pro: 1,000/month).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The prompt to improve (50–60,000 chars).", minLength: 50, maxLength: 60000 },
        expertRole: { type: "string", description: "Persona to write as, e.g. 'Staff Engineer / CTO'.", default: "expert" },
        lang: { type: "string", enum: ["EN", "TR"], default: "EN" },
        format: { type: "string", description: "Format to preserve, e.g. 'Claude XML'.", default: "Claude XML" },
      },
      required: ["prompt"],
    },
    annotations: { title: "Refine a prompt with Claude (credits)", readOnlyHint: true, idempotentHint: false, openWorldHint: true },
    async run(args, ctx) {
      if (!ctx.identity) return fail(`refine_prompt spends AI credits, so it needs an API key: add "Authorization: Bearer pm_live_…" to the MCP config. Create a key at ${KEYS_URL}`);
      const Body = z.object({
        prompt: z.string().min(50).max(60000),
        expertRole: z.string().max(120).default("expert"),
        lang: z.enum(["TR", "EN"]).default("EN"),
        format: z.string().max(40).default("Claude XML"),
      });
      const parsed = Body.safeParse(args);
      if (!parsed.success) return fail(`Invalid arguments — ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      try {
        const g = await guard(ctx.req, "refine", "mcp", { userId: ctx.identity.userId });
        const out = await complete(g, REFINE_SYSTEM, refineUserMessage(parsed.data));
        const credits = g.monthLimit != null ? `${g.monthLimit - (g.monthUsed ?? 0)} left this month` : `${g.remaining} left today`;
        return ok(out, `Used ${g.cost} AI credits (${g.plan} plan) · ${credits}.`);
      } catch (e) {
        if (e instanceof AiRouteError) return fail(e.message);
        console.error("[mcp:refine]", e);
        return fail("The AI call failed. Your credits were not used — please try again.");
      }
    },
  },
];

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
export const MCP_TOOL_NAMES = TOOLS.map((t) => t.name);

/** Public catalogue (tools/list, the developers page). */
export function toolCatalogue() {
  return TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations }));
}

/* ───────────── Prompts (slash commands in Claude Code: /mcp__prompt-monster__new_project) ───────────── */

const PROMPTS = [
  {
    name: "new_project",
    title: "Idea → master build prompt",
    description: "Turns a one-line product idea into a full master build prompt using the Prompt.Monster tools.",
    arguments: [
      { name: "idea", description: "The product idea in a sentence or two.", required: true },
      { name: "lang", description: "Output language: EN (default) or TR.", required: false },
    ],
  },
];

function getPrompt(name: string, args: Record<string, unknown>) {
  if (name !== "new_project") return null;
  const idea = String(args.idea ?? "").trim() || "(ask me for the idea first)";
  const lang = String(args.lang ?? "EN").toUpperCase() === "TR" ? "TR" : "EN";
  return {
    description: PROMPTS[0].description,
    messages: [
      {
        role: "user",
        content: text(
          [
            "Use the Prompt.Monster MCP tools to turn my idea into a master build prompt.",
            "1. Call list_project_types and choose the closest projectType.",
            "2. Draft the inputs: name, one-line pitch, a 100–200 word description, audience (role, pain, budget), 2–3 competitors, the USP, and 5–12 concrete v1 features. Ask me at most 3 short questions only if something essential is missing.",
            `3. Call generate_build_prompt with format "Claude XML" and lang "${lang}". Leave stack and experts empty unless I specified them.`,
            "4. Show me a short summary of the prompt, then ask whether to (a) start building from it here, (b) export the project files with export_files (Pro), or (c) refine it with refine_prompt.",
            "",
            `My idea: ${idea}`,
          ].join("\n"),
        ),
      },
    ],
  };
}

/* ───────────── Dispatcher ───────────── */

export function negotiateVersion(requested: unknown): string {
  return typeof requested === "string" && (MCP_PROTOCOL_VERSIONS as readonly string[]).includes(requested) ? requested : MCP_PROTOCOL_VERSIONS[0];
}

/** Handles one JSON-RPC message; returns null for notifications and client responses. */
export async function handleRpc(msg: unknown, ctx: ToolCtx): Promise<RpcResponse | null> {
  if (isNotification(msg)) return null; // notifications/initialized, cancelled, … — nothing to do (stateless)
  if (msg && typeof msg === "object" && !("method" in msg) && ("result" in msg || "error" in msg)) return null; // a response from the client
  if (!isRequest(msg)) {
    const id = msg && typeof msg === "object" && "id" in msg ? ((msg as { id: Id }).id ?? null) : null;
    return rpcError(id, -32600, "Invalid Request: expected a JSON-RPC 2.0 message.");
  }
  const { id, method } = msg;
  const params = (msg.params && typeof msg.params === "object" ? msg.params : {}) as Record<string, unknown>;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: negotiateVersion(params.protocolVersion),
        capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions: MCP_INSTRUCTIONS,
      });
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: toolCatalogue() });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const tool = TOOL_BY_NAME.get(name);
      if (!tool) return rpcError(id, -32602, `Unknown tool "${name}". Available: ${MCP_TOOL_NAMES.join(", ")}`);
      if (ctx.rateLimited) return rpcResult(id, fail(ctx.rateLimited));
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      try {
        return rpcResult(id, await tool.run(args, ctx));
      } catch (e) {
        if (e instanceof ApiInputError) return rpcResult(id, fail(e.message));
        console.error(`[mcp:${name}]`, e);
        return rpcResult(id, fail("The tool failed unexpectedly. Please try again."));
      }
    }
    case "prompts/list":
      return rpcResult(id, { prompts: PROMPTS });
    case "prompts/get": {
      const p = getPrompt(String(params.name ?? ""), (params.arguments ?? {}) as Record<string, unknown>);
      return p ? rpcResult(id, p) : rpcError(id, -32602, `Unknown prompt "${String(params.name ?? "")}".`);
    }
    // Not advertised, but some clients probe them — answer with empty lists instead of errors.
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "resources/templates/list":
      return rpcResult(id, { resourceTemplates: [] });
    case "logging/setLevel":
      return rpcResult(id, {});
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
