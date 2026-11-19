import { getAdmin } from "@/lib/admin";
import { projectTypeName } from "@/lib/prompt";
import { Panel, PageTitle, Table, Badge, fmtDate, fmtNum } from "@/components/admin/ui";
import { ShareAdminActions } from "@/components/admin/ShareAdminActions";
import { isMissingFunction } from "@/lib/share";

export const dynamic = "force-dynamic";

type Share = {
  slug: string;
  owner_id: string;
  email: string | null;
  name: string;
  project_type: string;
  version: number;
  lang: string;
  views: number;
  forks: number;
  listed: boolean;
  featured: boolean;
  hidden: boolean;
  created_at: string;
};

type Feedback = { id: number; slug: string | null; email: string | null; message: string; created_at: string };

export default async function AdminShares() {
  const admin = (await getAdmin())!;
  const [v2, { data: fbData }] = await Promise.all([
    admin.supabase.rpc("admin_shares_v2", { p_limit: 300 }),
    admin.supabase.rpc("admin_feedback", { p_limit: 50 }),
  ]);
  // admin_shares_v2 (0019) carries forks + gallery/moderation flags; the original RPC lacks them.
  const legacy = v2.error && isMissingFunction(v2.error.message);
  const { data, error } = legacy ? await admin.supabase.rpc("admin_shares", { p_limit: 300 }) : v2;
  const rows = ((data ?? []) as Partial<Share>[]).map(
    (r) => ({ ...r, forks: r.forks ?? 0, listed: r.listed ?? false, featured: r.featured ?? false, hidden: r.hidden ?? false, lang: r.lang ?? "" }) as Share,
  );
  const feedback = (fbData ?? []) as Feedback[];

  return (
    <>
      <PageTitle
        title="Paylaşımlar"
        subtitle="Herkese açık /p/<slug> sayfaları. Galeride öne çıkar, gizle veya kaldır; kaldırılan bağlantı 404 döner, kullanıcının projesi silinmez."
      />
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{error.message}</div>}
      <Panel>
        {rows.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Henüz paylaşım yok.</p>
        ) : (
          <Table head={["Sayfa", "Sahibi", "Tip", "v", "Görüntülenme", "Çatal", "Galeri", "Tarih", ""]}>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td className="px-4 py-2 max-w-[280px]">
                  <a href={`/p/${r.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-lime truncate block">
                    {r.name || "Adsız"} <span className="text-zinc-600 font-mono text-[11px]">/p/{r.slug}</span>
                  </a>
                </td>
                <td className="px-4 py-2 truncate max-w-[220px] text-zinc-400">{r.email ?? r.owner_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">
                  {projectTypeName(r.project_type)} <span className="text-zinc-600">· {r.lang}</span>
                </td>
                <td className="px-4 py-2 font-mono">v{r.version}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(r.views)}</td>
                <td className="px-4 py-2 tabular-nums">{fmtNum(r.forks)}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {r.hidden ? (
                    <Badge tone="red">Gizli</Badge>
                  ) : r.listed ? (
                    <Badge tone={r.featured ? "amber" : "lime"}>{r.featured ? "Öne çıkan" : "Listede"}</Badge>
                  ) : (
                    <Badge tone="zinc">Listede değil</Badge>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2">
                  <ShareAdminActions slug={r.slug} featured={r.featured} hidden={r.hidden} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {feedback.length > 0 && (
        <Panel title="Son bildirimler" className="mt-6">
          <Table head={["Sayfa", "Mesaj", "Tarih"]}>
            {feedback.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {f.slug ? (
                    <a href={`/p/${f.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-lime font-mono text-[12px]">
                      /p/{f.slug}
                    </a>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-300 max-w-[480px]">{f.message}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500">{fmtDate(f.created_at)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </>
  );
}
