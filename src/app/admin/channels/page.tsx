import { getAdmin } from "@/lib/admin";
import { channelOf } from "@/lib/attribution";
import { Badge, Panel, PageTitle, Stat, Table, fmtDate, fmtNum } from "@/components/admin/ui";
import { LinkBuilder } from "@/components/admin/LinkBuilder";

export const dynamic = "force-dynamic";

type ChannelRow = { source: string; medium: string; campaign: string; referrer: string; code: string; signups: number; pro: number; active_subs: number; first_seen: string; last_seen: string };
type SaleRow = { channel: string; code: string; subscriptions: number; active: number; monthly: number; yearly: number };

type Props = { searchParams: Promise<{ days?: string }> };

export default async function AdminChannels({ searchParams }: Props) {
  const { days = "90" } = await searchParams;
  const d = Math.min(3650, Math.max(1, Number(days) || 90));
  const admin = (await getAdmin())!;
  const [chRes, salesRes] = await Promise.all([admin.supabase.rpc("admin_channels", { p_days: d }), admin.supabase.rpc("admin_channel_sales", { p_days: d })]);
  const rows = (chRes.data ?? []) as ChannelRow[];
  const sales = (salesRes.data ?? []) as SaleRow[];

  // Group sign-ups by channel label (utm_source or referrer family).
  const byChannel = new Map<string, { signups: number; pro: number; active: number; codes: Set<string> }>();
  for (const r of rows) {
    const key = channelOf({ s: r.source || undefined, r: r.referrer || undefined, code: r.code || undefined });
    const cur = byChannel.get(key) ?? { signups: 0, pro: 0, active: 0, codes: new Set<string>() };
    cur.signups += r.signups;
    cur.pro += r.pro;
    cur.active += r.active_subs;
    if (r.code) cur.codes.add(r.code);
    byChannel.set(key, cur);
  }
  const channels = [...byChannel.entries()].sort((a, b) => b[1].signups - a[1].signups);
  const total = rows.reduce((a, r) => a + r.signups, 0);
  const attributed = rows.filter((r) => r.source || r.referrer || r.code).reduce((a, r) => a + r.signups, 0);
  const totalPro = rows.reduce((a, r) => a + r.pro, 0);
  const err = chRes.error?.message ?? salesRes.error?.message;

  return (
    <>
      <PageTitle
        title="Kanallar"
        subtitle="Kayıtlar hangi bağlantıdan / siteden geldi, kaçı Pro'ya geçti. Kaynak ilk ziyarette (utm_source, ref veya dış site) kaydedilir; ?code= ile gelen indirim kodu ödemede otomatik uygulanır."
        actions={
          <form className="flex gap-2" action="/admin/channels">
            <select name="days" defaultValue={String(d)} className="h-9 px-2 rounded-lg bg-ink-900 border border-ink-600 text-[13px]">
              {[7, 30, 90, 365].map((n) => (
                <option key={n} value={n}>
                  Son {n} gün
                </option>
              ))}
            </select>
            <button className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px] hover:border-ink-400">Göster</button>
          </form>
        }
      />
      {err && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          {err.includes("admin_channel") ? "Migration 0007 henüz uygulanmamış (supabase/migrations/0007_credits.sql)." : err}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Kayıt" value={fmtNum(total)} hint={`son ${d} gün`} />
        <Stat label="Kaynağı bilinen" value={total ? `%${Math.round((attributed / total) * 100)}` : "—"} hint={`${fmtNum(attributed)} kayıt`} />
        <Stat label="Pro'ya geçen" value={fmtNum(totalPro)} hint={total ? `dönüşüm %${((totalPro / total) * 100).toFixed(1)}` : undefined} tone="lime" />
        <Stat label="Kanal sayısı" value={fmtNum(channels.length)} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Kanal bazında kayıt ve dönüşüm">
          {channels.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz kaynaklı kayıt yok. Aşağıdaki araçla kampanya bağlantısı üretip paylaş.</p>
          ) : (
            <Table head={["Kanal", "Kayıt", "Pro", "Dönüşüm", "Kodlar"]}>
              {channels.map(([name, c]) => (
                <tr key={name}>
                  <td className="px-4 py-1.5 font-medium">{name}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.signups)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.pro)}</td>
                  <td className="px-4 py-1.5 tabular-nums text-zinc-400">{c.signups ? `%${((c.pro / c.signups) * 100).toFixed(1)}` : "—"}</td>
                  <td className="px-4 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {[...c.codes].map((k) => (
                        <Badge key={k} tone="lime">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Satın almalar (ödeme anındaki kanal / kod)">
          {sales.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz abonelik yok.</p>
          ) : (
            <Table head={["Kanal", "Kod", "Abonelik", "Aktif", "Aylık", "Yıllık"]}>
              {sales.map((r) => (
                <tr key={`${r.channel}-${r.code}`}>
                  <td className="px-4 py-1.5 font-medium">{r.channel}</td>
                  <td className="px-4 py-1.5">{r.code ? <Badge tone="lime">{r.code}</Badge> : <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.subscriptions)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.active)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.monthly)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.yearly)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Kampanya bağlantısı oluştur">
          <LinkBuilder />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Ayrıntılı kaynaklar (utm / referrer / kod)">
          {rows.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Kayıt yok.</p>
          ) : (
            <Table head={["Kaynak", "Medium", "Kampanya", "Referrer", "Kod", "Kayıt", "Pro", "İlk", "Son"]}>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-1.5">{r.source || <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-1.5 text-zinc-400">{r.medium || "—"}</td>
                  <td className="px-4 py-1.5 text-zinc-400">{r.campaign || "—"}</td>
                  <td className="px-4 py-1.5 text-zinc-400 truncate max-w-[200px]">{r.referrer || "—"}</td>
                  <td className="px-4 py-1.5">{r.code ? <Badge tone="lime">{r.code}</Badge> : "—"}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.signups)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(r.pro)}</td>
                  <td className="px-4 py-1.5 whitespace-nowrap text-zinc-500">{fmtDate(r.first_seen)}</td>
                  <td className="px-4 py-1.5 whitespace-nowrap text-zinc-500">{fmtDate(r.last_seen)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
