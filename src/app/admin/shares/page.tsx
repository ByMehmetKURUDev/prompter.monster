import { getAdmin } from "@/lib/admin";
import { projectTypeName } from "@/lib/prompt";
import { Panel, PageTitle, Table, fmtDate, fmtNum } from "@/components/admin/ui";
import { ShareAdminActions } from "@/components/admin/ShareAdminActions";

export const dynamic = "force-dynamic";

type Share = { slug: string; owner_id: string; email: string | null; name: string; project_type: string; version: number; views: number; created_at: string };

export default async function AdminShares() {
  const admin = (await getAdmin())!;
  const { data, error } = await admin.supabase.rpc("admin_shares", { p_limit: 300 });
  const rows = (data ?? []) as Share[];
  return (
    <>
      <PageTitle title="Paylaşımlar" subtitle="Herkese açık /p/<slug> sayfaları. Uygunsuz içeriği kaldır; kaldırılan bağlantı 404 döner, kullanıcının projesi silinmez." />
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{error.message}</div>}
      <Panel>
        {rows.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Henüz paylaşım yok.</p>
        ) : (
          <Table head={["Sayfa", "Sahibi", "Tip", "v", "Görüntülenme", "Tarih", ""]}>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td className="px-4 py-2 max-w-[280px]">
                  <a href={`/p/${r.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-lime truncate block">
                    {r.name || "Adsız"} <span className="text-zinc-600 font-mono text-[11px]">/p/{r.slug}</span>
                  </a>
                </td>
                <td className="px-4 py-2 truncate max-w-[220px] text-zinc-400">{r.email ?? r.owner_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{projectTypeName(r.project_type)}</td>
                <td className="px-4 py-2 font-mono">v{r.version}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(r.views)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2">
                  <ShareAdminActions slug={r.slug} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
