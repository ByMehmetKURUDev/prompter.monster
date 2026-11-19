import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { teamErrorCode, teamErrorMessage } from "@/lib/team";

export const runtime = "nodejs";

const Uuid = z.string().uuid();

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(2).max(60) }),
  z.object({ action: z.literal("rename"), name: z.string().trim().min(2).max(60) }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("invite"), email: z.string().trim().max(254).optional(), role: z.enum(["member", "admin"]).default("member") }),
  z.object({ action: z.literal("revoke"), inviteId: Uuid }),
  z.object({ action: z.literal("join"), token: z.string().trim().min(20).max(100) }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("remove"), userId: Uuid }),
  z.object({ action: z.literal("role"), userId: Uuid, role: z.enum(["admin", "member"]) }),
  z.object({ action: z.literal("transfer"), userId: Uuid }),
  z.object({ action: z.literal("share"), projectId: Uuid, share: z.boolean() }),
]);

const STATUS: Record<string, number> = {
  not_authenticated: 401,
  forbidden: 403,
  banned: 403,
  no_team: 404,
  invite_not_found: 404,
  invalid_invite: 404,
  not_member: 404,
  already_in_team: 409,
  already_member: 409,
  seats_full: 409,
  team_active: 409,
  team_canceled: 409,
  invite_revoked: 410,
  invite_used: 410,
  invite_expired: 410,
  owner_cannot_leave: 409,
  team_inactive: 409,
  project_not_found: 404,
  not_ready: 503,
};

/**
 * POST /api/team { action, ... } — every team action of the signed-in user (create, rename, delete,
 * invite, revoke, join, leave, remove, role, transfer). Each one is a security-definer RPC that checks
 * the caller's role itself (0017_teams.sql); this route only validates input and maps errors to text.
 */
export async function POST(req: Request) {
  const locale = req.headers.get("x-pm-locale") === "en" ? "en" : "tr";
  const fail = (code: string, status?: number) =>
    NextResponse.json({ error: teamErrorMessage(code, locale), code }, { status: status ?? STATUS[code] ?? 400 });

  if (!supabaseConfigured()) return fail("not_ready", 503);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const field = (parsed.error.issues[0]?.path ?? [])[0];
    return fail(field === "name" ? "invalid_name" : field === "email" ? "invalid_email" : "bad_request", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("not_authenticated");

  const b = parsed.data;
  let data: unknown = null;
  let error: { message?: string | null; code?: string | null } | null = null;
  switch (b.action) {
    case "create":
      ({ data, error } = await supabase.rpc("create_team", { p_name: b.name }));
      break;
    case "rename":
      ({ error } = await supabase.rpc("rename_team", { p_name: b.name }));
      break;
    case "delete":
      ({ error } = await supabase.rpc("delete_team"));
      break;
    case "invite":
      ({ data, error } = await supabase
        .rpc("create_team_invite", { p_email: b.email || null, p_role: b.role })
        .maybeSingle<{ invite_id: string; invite_token: string; invite_expires_at: string }>());
      break;
    case "revoke":
      ({ error } = await supabase.rpc("revoke_team_invite", { p_invite: b.inviteId }));
      break;
    case "join":
      ({ data, error } = await supabase.rpc("accept_team_invite", { p_token: b.token }));
      break;
    case "leave":
      ({ error } = await supabase.rpc("leave_team"));
      break;
    case "remove":
      ({ error } = await supabase.rpc("remove_team_member", { p_user: b.userId }));
      break;
    case "role":
      ({ error } = await supabase.rpc("set_team_member_role", { p_user: b.userId, p_role: b.role }));
      break;
    case "transfer":
      ({ error } = await supabase.rpc("transfer_team_ownership", { p_user: b.userId }));
      break;
    case "share":
      ({ data, error } = await supabase.rpc("set_project_team_share", { p_project: b.projectId, p_share: b.share }));
      break;
  }

  if (error) {
    const code = teamErrorCode(error);
    if (!code) console.error("[team]", b.action, error.message);
    return fail(code ?? "failed", code ? undefined : 500);
  }

  if (b.action === "invite") {
    const inv = data as { invite_id: string; invite_token: string; invite_expires_at: string } | null;
    if (!inv) return fail("failed", 500);
    return NextResponse.json({ ok: true, invite: { id: inv.invite_id, token: inv.invite_token, expiresAt: inv.invite_expires_at } });
  }
  if (b.action === "share") return NextResponse.json({ ok: true, shared: data === true });
  return NextResponse.json({ ok: true, ...(b.action === "create" || b.action === "join" ? { teamId: data } : {}) });
}
