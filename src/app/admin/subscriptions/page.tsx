import { getAdmin } from "@/lib/admin";
import { Badge, Panel, PageTitle, Table, fmtDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  owner_id: string;
  email: string | null;
  provider: string;
  provider_ref: string;
  status: string;
  plan: string | null;
  customer_ref: string | null;
  portal_url: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

const TONE: Record<string, "lime" | "amber" | "red" | "zinc"> = { active: "lime", on_trial: "lime", past_due: "amber", paused: "amber", cancelled: "red", expired: "red", unpaid: "red" };

export default async function AdminSubscriptions() {
  const admin = (await getAdmin())!;
  const { data, error } = await admin.supabase.rpc("admin_subscriptions", { p_limit: 200 });
  const rows = (data ?? []) as Sub[];
  const store = process.env.LEMONSQUEEZY_STORE_ID;
  const testMode = true; // flips to false when the store is activated and live keys are set (see /admin/system)

  return (
    <>
      <PageTitle
        title="Abonelikler"
        subtitle="Lemon Squeezy webhook'larından gelen kayıtlar. Detay ve iade için Lemon Squeezy panelini kullan; burada yalnız durum görünür."
        actions={
          <a href="https://app.lemonsqueezy.com/subscriptions" target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px] flex items-center hover:border-ink-400">
            Lemon Squeezy ↗
          </a>
        }
      />
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{error.message}</div>}
      <Panel>
        {rows.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Henüz abonelik yok.</p>
        ) : (
          <Table head={["Kullanıcı", "Durum", "Plan", "Yenileme", "Sağlayıcı ref", "Oluşturma", "Güncelleme", "Portal"]}>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 truncate max-w-[240px] font-medium">{s.email ?? s.owner_id}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Badge tone={TONE[s.status] ?? "zinc"}>{s.status}</Badge>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{s.plan === "yearly" ? "Yıllık $290" : s.plan === "monthly" ? "Aylık $29" : s.plan ?? "—"}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(s.current_period_end)}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-zinc-500">
                  {s.provider}:{s.provider_ref}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(s.created_at)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(s.updated_at, true)}</td>
                <td className="px-4 py-2">
                  {s.portal_url ? (
                    <a href={s.portal_url} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline text-[12px]">
                      aç ↗
                    </a>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <p className="mt-3 text-[12px] text-zinc-500">
        Mağaza #{store ?? "?"} • {testMode ? "Test modu kayıtları da bu listede görünür (provider_ref test ID'leridir)." : ""}
      </p>
    </>
  );
}
