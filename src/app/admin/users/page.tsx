import { getAdmin } from "@/lib/admin";
import { Badge, Panel, PageTitle, Table, fmtDate, fmtNum } from "@/components/admin/ui";
import { UserActions } from "@/components/admin/UserActions";

export const dynamic = "force-dynamic";

export type AdminUserRow = {
  id: string;
  email: string | null;
  plan: "free" | "pro";
  role: "user" | "admin";
  plan_locked: boolean;
  banned_at: string | null;
  note: string | null;
  created_at: string;
  projects: number;
  generations: number;
  ai_30d: number;
  last_active: string | null;
  pro_interest_at: string | null;
};

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminUsers({ searchParams }: Props) {
  const { q = "", page = "1" } = await searchParams;
  const admin = (await getAdmin())!;
  const limit = 50;
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const { data, error } = await admin.supabase.rpc("admin_users", { p_search: q || null, p_limit: limit, p_offset: offset });
  const rows = (data ?? []) as AdminUserRow[];

  return (
    <>
      <PageTitle
        title="Kullanıcılar"
        subtitle="Plan, rol ve erişimi buradan yönet. Plan kilidi açıkken ödeme webhook'u planı değiştiremez (manuel Pro / hediye)."
        actions={
          <form className="flex gap-2" action="/admin/users">
            <input name="q" defaultValue={q} placeholder="e-posta ara…" className="h-9 px-3 rounded-lg bg-ink-900 border border-ink-600 text-[13px] w-[240px] focus:outline-none focus:border-violet" />
            <button className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px] hover:border-ink-400">Ara</button>
          </form>
        }
      />
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{error.message}</div>}
      <Panel>
        {rows.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Kayıt bulunamadı.</p>
        ) : (
          <Table head={["Kullanıcı", "Plan", "Rol", "Proje", "Üretim", "AI 30g", "Son aktivite", "Kayıt", "İşlem"]}>
            {rows.map((u) => (
              <tr key={u.id} className={u.banned_at ? "opacity-60" : undefined}>
                <td className="px-4 py-2 max-w-[260px]">
                  <div className="truncate font-medium">{u.email ?? u.id}</div>
                  <div className="text-[10px] text-zinc-600 font-mono truncate">{u.id}</div>
                  {u.note && <div className="text-[11px] text-amber-300/80 truncate">📝 {u.note}</div>}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Badge tone={u.plan === "pro" ? "lime" : "zinc"}>{u.plan.toUpperCase()}</Badge>
                  {u.plan_locked && (
                    <span className="ml-1">
                      <Badge tone="amber">kilitli</Badge>
                    </span>
                  )}
                  {u.pro_interest_at && !u.plan.includes("pro") && (
                    <span className="ml-1">
                      <Badge tone="violet">ilgili</Badge>
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{u.role === "admin" ? <Badge tone="violet">admin</Badge> : <span className="text-zinc-500">user</span>}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(u.projects)}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(u.generations)}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(u.ai_30d)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(u.last_active, true)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-2">
                  <UserActions user={u} selfId={admin.user.id} />
                </td>
              </tr>
            ))}
          </Table>
        )}
        <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
          <span>
            Sayfa {page} • {rows.length} kayıt
          </span>
          <div className="flex gap-2">
            {Number(page) > 1 && (
              <a href={`/admin/users?q=${encodeURIComponent(q)}&page=${Number(page) - 1}`} className="hover:text-white">
                ← Önceki
              </a>
            )}
            {rows.length === limit && (
              <a href={`/admin/users?q=${encodeURIComponent(q)}&page=${Number(page) + 1}`} className="hover:text-white">
                Sonraki →
              </a>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
