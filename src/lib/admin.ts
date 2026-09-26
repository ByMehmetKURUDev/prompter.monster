import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "./supabase/server";

/** Server-only admin gate. Admin = profiles.role = 'admin' OR e-mail listed in ADMIN_EMAILS (comma separated). */

export interface AdminContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string | null };
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Resolves the current admin or returns null (no throw). */
export async function getAdmin(): Promise<AdminContext | null> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const email = user.email?.toLowerCase() ?? null;
    let isAdmin = Boolean(email && adminEmails().includes(email));
    if (!isAdmin) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string }>();
      isAdmin = data?.role === "admin";
    }
    if (!isAdmin) return null;
    return { supabase, user: { id: user.id, email: user.email ?? null } };
  } catch {
    return null;
  }
}

/** For Route Handlers: 401/403 JSON when not an admin. */
export async function requireAdminApi(): Promise<AdminContext | NextResponse> {
  const ctx = await getAdmin();
  if (!ctx) return NextResponse.json({ error: "forbidden", message: "Bu uç nokta yalnız yöneticilere açık." }, { status: 403 });
  return ctx;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
