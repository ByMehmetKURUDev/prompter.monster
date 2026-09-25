import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LibraryList } from "@/components/library/LibraryList";
import type { ProjectSummary } from "@/lib/db";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projelerim", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  if (!supabaseConfigured()) redirect("/studio");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/library");

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,project_type,updated_at,created_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200);
  const { data: gens } = await supabase.from("generations").select("project_id,version").eq("owner_id", user.id);
  const byProject = new Map<string, number[]>();
  (gens ?? []).forEach((g) => byProject.set(g.project_id, [...(byProject.get(g.project_id) ?? []), g.version]));
  const items: ProjectSummary[] = (projects ?? []).map((p) => {
    const v = byProject.get(p.id) ?? [];
    return { ...p, versions: v.length, latest_version: v.length ? Math.max(...v) : null };
  });

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="hidden sm:block text-zinc-500">{user.email}</span>
          <Link href="/studio" className="h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center">
            Studio
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-zinc-300">
              Çıkış
            </button>
          </form>
        </nav>
      </header>
      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projelerim</h1>
            <p className="text-[13px] text-zinc-500 mt-1">Kaydettiğin canavarlar ve versiyonları. Aç deyince Studio son versiyonla yüklenir.</p>
          </div>
          <Link href="/studio?new=1" className="h-10 px-4 rounded-lg bg-ink-800 border border-ink-600 text-[13px] font-semibold flex items-center">
            + Yeni canavar
          </Link>
        </div>
        <LibraryList initial={items} />
      </main>
    </div>
  );
}
