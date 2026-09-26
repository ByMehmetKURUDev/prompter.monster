import Link from "next/link";
import { getAdmin } from "@/lib/admin";
import { readAllSettings } from "@/lib/settings-server";
import { Badge, Bars, Panel, PageTitle, Stat, Table, fmtDate, fmtNum } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type KeyRow = { id: string; email: string; plan: string; name: string; prefix: string; created_at: string; last_used_at: string | null; calls: number; revoked_at: string | null };
type StatRow = { day: string; kind: string; name: string; keyed: boolean; calls: number };
type SourceRow = { source: string; calls: number; credits: number; tokens_in: number; tokens_out: number; users: number };

export default async function AdminApi() {
  const admin = (await getAdmin())!;
  const since = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
  const [keysRes, statsRes, sourcesRes, settings] = await Promise.all([
    admin.supabase.rpc("admin_api_keys", { p_limit: 200 }),
    admin.supabase.from("api_call_stats").select("day,kind,name,keyed,calls").gte("day", since).order("day", { ascending: true }).limit(5000),
    admin.supabase.rpc("admin_usage_sources", { p_days: 30 }),
    readAllSettings(),
  ]);
  const keys = (keysRes.data ?? []) as KeyRow[];
  const stats = (statsRes.data ?? []) as StatRow[];
  const sources = (sourcesRes.data ?? []) as SourceRow[];
  const v = settings.values;
  const missing = [keysRes.error, statsRes.error, sourcesRes.error].find(Boolean);

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
  const perDay = (kind: string) => days.map((d) => stats.filter((s) => s.day === d && s.kind === kind).reduce((a, s) => a + Number(s.calls), 0));
  const total = stats.reduce((a, s) => a + Number(s.calls), 0);
  const keyed = stats.filter((s) => s.keyed).reduce((a, s) => a + Number(s.calls), 0);
  const byName = new Map<string, { kind: string; name: string; keyed: number; anon: number }>();
  for (const s of stats) {
    const k = `${s.kind}:${s.name}`;
    const row = byName.get(k) ?? { kind: s.kind, name: s.name, keyed: 0, anon: 0 };
    if (s.keyed) row.keyed += Number(s.calls);
    else row.anon += Number(s.calls);
    byName.set(k, row);
  }
  const names = [...byName.values()].sort((a, b) => b.keyed + b.anon - (a.keyed + a.anon));
  const active = keys.filter((k) => !k.revoked_at);
  const owners = new Set(active.map((k) => k.email)).size;

  return (
    <>
      <PageTitle
        title="API ve MCP"
        subtitle="Public API (/api/v1), MCP sunucusu (/api/mcp) ve API anahtarları. Son 30 gün."
        actions={
          <Link href="/admin/settings#Entegrasyon" className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12.5px] flex items-center">
            Ayarlar → Entegrasyon
          </Link>
        }
      />
      {missing && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          {/admin_api_keys|api_call_stats|admin_usage_sources|does not exist|schema cache/.test(missing.message)
            ? "Migration 0008 (API + MCP) henüz uygulanmamış: supabase/migrations/0008_api.sql"
            : missing.message}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Durum"
          value={
            <span className="flex flex-wrap gap-1.5 text-[13px] font-semibold">
              <Badge tone={v.api_enabled ? "lime" : "red"}>REST {v.api_enabled ? "açık" : "kapalı"}</Badge>
              <Badge tone={v.mcp_enabled ? "lime" : "red"}>MCP {v.mcp_enabled ? "açık" : "kapalı"}</Badge>
            </span>
          }
          hint={`Hız: anahtarla ${v.api_rate_per_minute}/dk • anahtarsız ${v.api_anon_rate_per_minute}/dk`}
        />
        <Stat label="Çağrı / 30g" value={fmtNum(total)} hint={`%${total ? Math.round((keyed / total) * 100) : 0} anahtarlı • MCP: initialize + araç çağrıları`} tone="lime" />
        <Stat label="Aktif anahtar" value={fmtNum(active.length)} hint={`${owners} kullanıcı • toplam ${keys.length} (iptal dahil)`} />
        <Stat
          label="API/MCP AI kredisi"
          value={fmtNum(sources.filter((s) => s.source !== "web").reduce((a, s) => a + Number(s.credits), 0))}
          hint="refine_prompt ve /api/v1/refine (30 gün)"
          tone="violet"
        />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Günlük çağrı">
          <Bars series={[perDay("api"), perDay("mcp")]} labels={days.map((d) => d.slice(5))} colors={["#38BDF8", "#A3FF12"]} />
          <div className="mt-2 text-[11px] text-zinc-500">mavi: REST API • yeşil: MCP</div>
        </Panel>
        <Panel title="Uç nokta / araç (30 gün)">
          {names.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz çağrı yok. Kurulum sayfası: /developers</p>
          ) : (
            <Table head={["Tür", "Ad", "Anahtarlı", "Anahtarsız"]}>
              {names.map((n) => (
                <tr key={`${n.kind}:${n.name}`}>
                  <td className="px-4 py-1.5">
                    <Badge tone={n.kind === "mcp" ? "lime" : "violet"}>{n.kind}</Badge>
                  </td>
                  <td className="px-4 py-1.5 font-mono text-[12px]">{n.name}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(n.keyed)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(n.anon)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="AI kredisi kaynağa göre (30 gün)">
          {sources.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz AI çağrısı yok.</p>
          ) : (
            <Table head={["Kaynak", "Çağrı", "Kredi", "Giriş token", "Çıkış token", "Kullanıcı"]}>
              {sources.map((s) => (
                <tr key={s.source}>
                  <td className="px-4 py-1.5">
                    <Badge tone={s.source === "web" ? "zinc" : "lime"}>{s.source}</Badge>
                  </td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(s.calls))}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(s.credits))}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(s.tokens_in))}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(s.tokens_out))}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(s.users))}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={`API anahtarları (${keys.length})`}>
          {keys.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz anahtar yok. Kullanıcılar /account/api sayfasından oluşturur.</p>
          ) : (
            <Table head={["Kullanıcı", "Plan", "Ad", "Önek", "Oluşturma", "Son kullanım", "İstek", "Durum"]}>
              {keys.map((k) => (
                <tr key={k.id} className={k.revoked_at ? "opacity-50" : ""}>
                  <td className="px-4 py-1.5 max-w-[220px] truncate">{k.email}</td>
                  <td className="px-4 py-1.5">
                    <Badge tone={k.plan === "pro" ? "lime" : "zinc"}>{k.plan}</Badge>
                  </td>
                  <td className="px-4 py-1.5 max-w-[180px] truncate">{k.name}</td>
                  <td className="px-4 py-1.5 font-mono text-[12px]">{k.prefix}…</td>
                  <td className="px-4 py-1.5 whitespace-nowrap">{fmtDate(k.created_at)}</td>
                  <td className="px-4 py-1.5 whitespace-nowrap">{fmtDate(k.last_used_at, true)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(k.calls))}</td>
                  <td className="px-4 py-1.5">{k.revoked_at ? <Badge tone="red">iptal</Badge> : <Badge tone="lime">aktif</Badge>}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
