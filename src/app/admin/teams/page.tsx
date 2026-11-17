import { getAdmin } from "@/lib/admin";
import { Badge, Panel, PageTitle, Stat, Table, fmtDate, fmtNum } from "@/components/admin/ui";
import { TeamAdminActions } from "@/components/admin/TeamAdminActions";

export const dynamic = "force-dynamic";

type AdminTeamRow = {
  id: string;
  name: string;
  status: "pending" | "active" | "canceled";
  seats: number;
  members: number;
  pending_invites: number;
  owner_id: string;
  owner_email: string | null;
  note: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
};

const TONE = { pending: "amber", active: "lime", canceled: "red" } as const;
const LABEL = { pending: "Aktivasyon bekliyor", active: "Aktif", canceled: "İptal" } as const;

export default async function AdminTeams() {
  const admin = (await getAdmin())!;
  const { data, error } = await admin.supabase.rpc("admin_teams", { p_limit: 500 });
  const rows = (data ?? []) as AdminTeamRow[];
  const active = rows.filter((r) => r.status === "active");
  const pending = rows.filter((r) => r.status === "pending");
  const sum = (list: AdminTeamRow[], k: "seats" | "members") => list.reduce((a, r) => a + (r[k] ?? 0), 0);

  return (
    <>
      <PageTitle
        title="Takımlar"
        subtitle="Takımlar 'Aktivasyon bekliyor' olarak kurulur. Aktifleştirince tüm üyelerin etkin planı Pro olur (Studio, kredi kotası, API ve MCP). Koltuk bazlı Lemon Squeezy ödemesi LS aktivasyonuna bırakıldı — o zamana kadar faturalı/kurumsal satışta buradan aktifleştir."
      />
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          {/does not exist|could not find/i.test(error.message) ? "Takım tabloları henüz yok: supabase/migrations/0017_teams.sql uygulanmalı." : error.message}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Takım" value={fmtNum(rows.length)} />
        <Stat label="Aktif" value={fmtNum(active.length)} tone="lime" />
        <Stat label="Aktivasyon bekleyen" value={fmtNum(pending.length)} tone={pending.length ? "violet" : "default"} />
        <Stat label="Aktif üye / koltuk" value={`${fmtNum(sum(active, "members"))} / ${fmtNum(sum(active, "seats"))}`} />
      </div>
      <Panel>
        {rows.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Henüz takım yok. Kullanıcılar Hesabım → Takım bölümünden kurar; fiyat sayfasında 'Takımlar için' bandı var.</p>
        ) : (
          <Table head={["Takım", "Sahip", "Durum", "Üye / koltuk", "Bekleyen davet", "Kuruluş", "Aktivasyon", "Not", ""]}>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 font-medium max-w-[220px] truncate" title={t.id}>
                  {t.name}
                </td>
                <td className="px-4 py-2 truncate max-w-[220px] text-zinc-300">{t.owner_email ?? t.owner_id}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Badge tone={TONE[t.status] ?? "zinc"}>{LABEL[t.status] ?? t.status}</Badge>
                </td>
                <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                  {t.members} / {t.seats}
                </td>
                <td className="px-4 py-2 whitespace-nowrap tabular-nums text-zinc-400">{t.pending_invites}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(t.created_at)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(t.activated_at)}</td>
                <td className="px-4 py-2 max-w-[220px] truncate text-zinc-400" title={t.note ?? ""}>
                  {t.note ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <TeamAdminActions team={{ id: t.id, name: t.name, status: t.status, seats: t.seats, members: t.members, note: t.note }} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
