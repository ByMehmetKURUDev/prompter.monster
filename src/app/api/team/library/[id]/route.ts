import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { teamErrorCode } from "@/lib/team";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/team/library/:projectId — a project a teammate shared with my active team (0020 team_project()),
 * so the Studio can open it as my own unsaved copy (?teamProject=<id>). Read-only; the owner's project never changes.
 */
export async function GET(_req: Request, { params }: Ctx) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "no_supabase", code: "no_supabase" }, { status: 503 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "bad_request", code: "bad_request" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated", code: "unauthenticated" }, { status: 401 });

  const { data, error } = await supabase.rpc("team_project", { p_project: id }).maybeSingle<{
    project_id: string;
    name: string;
    project_type: string;
    state: unknown;
    owner_username: string | null;
    is_mine: boolean;
  }>();
  if (error) {
    const code = teamErrorCode(error) ?? "failed";
    if (code === "failed") console.error("[team/library]", error.message);
    return NextResponse.json({ error: code, code }, { status: code === "not_ready" ? 503 : 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found", code: "not_found" }, { status: 404 });
  return NextResponse.json(
    { id: data.project_id, name: data.name, projectType: data.project_type, state: data.state, owner: data.owner_username, isMine: data.is_mine },
    { headers: { "Cache-Control": "no-store" } },
  );
}
