/**
 * Minimal client for the Prompter.Monster public API (https://prompter.monster/api/v1).
 * Mirrors the shapes in src/lib/api-core.ts and src/app/api/v1/* on the main site — this
 * extension has no build step shared with the Next.js app, so the two are kept in sync by
 * hand. Human docs: prompter.monster/developers. Machine-readable spec: /api/v1/openapi.json.
 *
 * No backend/DB changes needed for this extension — it only calls the already-live public API,
 * the same one the MCP server and prompter.monster/developers API keys page use.
 */
import { getPreferenceValues } from "@raycast/api";

const SITE = "https://prompter.monster";

export interface Preferences {
  apiKey?: string;
  lang?: "EN" | "TR";
}

/** src/lib/data.ts#FORMATS, kept in sync by hand. */
export const FORMATS = ["ChatGPT Markdown", "Claude XML", "Cursor Rules", "v0", "Lovable/Bolt"] as const;
export type Format = (typeof FORMATS)[number];

export interface ProjectType {
  id: string;
  name: string;
  category: string;
  badge?: string;
  description?: string;
  url?: string;
}

export interface GenerateInput {
  name: string;
  pitch?: string;
  description?: string;
  projectType?: string;
  format?: Format;
  lang?: "EN" | "TR";
  /** Always "mega" from this extension — a single combined prompt is what you want to paste somewhere. */
  output?: "mega";
}

export interface GenerateResult {
  plan: "free" | "pro";
  name: string;
  projectType: string;
  projectTypeName: string;
  format: string;
  lang: string;
  experts: string[];
  header: string;
  megaPrompt?: string;
  notes: string[];
  studioUrl: string;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export class PromptMonsterError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function authHeaders(): Record<string, string> {
  const { apiKey } = getPreferenceValues<Preferences>();
  return apiKey?.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {};
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as (ApiErrorBody & { data?: T }) | null;
  if (!res.ok) {
    throw new PromptMonsterError(body?.error?.code ?? "unknown", body?.error?.message ?? `prompter.monster returned ${res.status}.`);
  }
  if (!body || !("data" in body)) throw new PromptMonsterError("unknown", "Unexpected response from prompter.monster.");
  return body.data as T;
}

/** GET /api/v1/types — project types with their landing pages. No key required. */
export async function listProjectTypes(lang: "EN" | "TR" = "EN"): Promise<ProjectType[]> {
  const res = await fetch(`${SITE}/api/v1/types?lang=${lang}`, { headers: authHeaders() });
  return parseOrThrow<ProjectType[]>(res);
}

/** POST /api/v1/generate — deterministic, no AI credits spent. Free-plan limits apply without an API key. */
export async function generatePrompt(input: GenerateInput): Promise<GenerateResult> {
  const res = await fetch(`${SITE}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ output: "mega", ...input }),
  });
  return parseOrThrow<GenerateResult>(res);
}
