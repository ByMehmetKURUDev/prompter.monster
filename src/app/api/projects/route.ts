import { NextResponse } from "next/server";
import { z } from "zod";
import type { ProjectSummary } from "@/lib/db";
import { buildMegaPrompt, estimateTokens } from "@/lib/prompt";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import type { StudioState } from "@/lib/types";

export const runtime = "nodejs";

const StateSchema = z
  .object({
    step: z.number().int().min(1).max(4),
    projectType: z.string().max(60),
    name: z.string().max(120),
    pitch: z.string().max(300),
    description: z.string().max(4000),
    audience: z.object({ role: z.string().max(200), pain: z.string().max(300), budget: z.string().max(100) }),
    competitors: z.array(z.string().max(120)).max(10),
    usp: z.string().max(2000),
    monetization: z.array(z.string().max(60)).max(20),
    frontend: z.array(z.string().max(60)).max(20),
    backend: z.array(z.string().max(60)).max(20),
    database: z.array(z.string().max(60)).max(20),
    auth: z.array(z.string().max(60)).max(20),
    ai: z.array(z.string().max(60)).max(20),
    realtime: z.array(z.string().max(60)).max(20),
    search: z.array(z.string().max(60)).max(20),
    features: z.array(z.string().max(80)).max(60),
    payments: z.array(z.string().max(40)).max(20),
    compliance: z.array(z.string().max(40)).max(20),
    experts: z.array(z.string().max(40)).max(24),
    lang: z.enum(["TR", "EN"]),
    format: z.enum(["ChatGPT Markdown", "Claude XML", "Cursor Rules", "v0", "Lovable/Bolt"]),
  })
  .strict();

const SaveBody = z.object({
  id: z.string().uuid().optional(),
  state: StateSchema,
  /** true → also store a new generation (version) with the mega prompt */
  snapshot: z.boolean().default(false),
  refined: z.record(z.string(), z.string().max(60000)).optional(),
});

async function requireUser() {
  if (!supabaseConfigured()) return { error: NextResponse.json({ error: "Hesap sistemi yapılandırılmamış.", code: "no_supabase" }, { status: 503 }) };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Kaydetmek için giriş yapın.", code: "unauthenticated" }, { status: 401 }) };
  return { supabase, user };
}

/** List my projects with version counts. */
export async function GET() {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,name,project_type,updated_at,created_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: gens } = await supabase.from("generations").select("project_id,version").eq("owner_id", user.id);
  const byProject = new Map<string, number[]>();
  (gens ?? []).forEach((g) => byProject.set(g.project_id, [...(byProject.get(g.project_id) ?? []), g.version]));

  const out: ProjectSummary[] = (projects ?? []).map((p) => {
    const v = byProject.get(p.id) ?? [];
    return { ...p, versions: v.length, latest_version: v.length ? Math.max(...v) : null };
  });
  return NextResponse.json({ projects: out }, { headers: { "Cache-Control": "no-store" } });
}

/** Create/update a project; optionally store a generation snapshot. */
export async function POST(req: Request) {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const parsed = SaveBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz proje verisi.", code: "bad_request" }, { status: 400 });
  const { id, state, snapshot, refined } = parsed.data;
  const s = state as StudioState;
  const name = s.name.trim() || "Adsız canavar";

  let projectId = id;
  if (projectId) {
    const { error } = await supabase
      .from("projects")
      .update({ name, project_type: s.projectType, state: s })
      .eq("id", projectId)
      .eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({ owner_id: user.id, name, project_type: s.projectType, state: s })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
    projectId = data.id;
  }

  let version: number | null = null;
  if (snapshot) {
    const { data: last } = await supabase
      .from("generations")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    version = (last?.version ?? 0) + 1;
    const { error } = await supabase.from("generations").insert({
      project_id: projectId,
      owner_id: user.id,
      version,
      format: s.format,
      lang: s.lang,
      experts: s.experts,
      output: buildMegaPrompt(s),
      refined: refined ?? null,
      token_estimate: estimateTokens(s),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: projectId, version });
}
