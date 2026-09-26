import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdmin } from "@/lib/admin";
import { projectTypeName } from "@/lib/prompt";
import { readAllSettings } from "@/lib/settings-server";
import { CHANGELOG } from "@/lib/changelog";
import { Badge, Bars, Panel, PageTitle, Stat, Table, fmtDate, fmtNum } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Stats = Record<string, number>;
type Daily = { day: string; signups: number; generations: number; ai_calls: number; ai_enhance: number; ai_suggest: number; ai_refine: number };
type Gen = { id: string; email: string; name: string; project_type: string; version: number; format: string; lang: string; experts: string[]; created_at: string };

export default async function AdminOverview() {
  const admin = (await getAdmin())!;
  const sb = admin.supabase;
  const [statsRes, dailyRes, gensRes, settings] = await Promise.all([
    sb.rpc("admin_stats"),
    sb.rpc("admin_daily", { p_days: 14 }),
    sb.rpc("admin_recent_generations", { p_limit: 10 }),
    readAllSettings(),
  ]);
  const s = (statsRes.data ?? {}) as Stats;
  const daily = (dailyRes.data ?? []) as Daily[];
  const gens = (gensRes.data ?? []) as Gen[];
  const mrr = (s.subs_monthly ?? 0) * 29 + ((s.subs_yearly ?? 0) * 290) / 12;
  const flags = settings.values;
  const warnings: string[] = [];
  if (flags.maintenance_mode) warnings.push("Bakım modu AÇIK — AI ve ödeme kapalı.");
  if (!flags.ai_enabled) warnings.push("AI özellikleri kapalı (kill switch).");
  if (!flags.checkout_enabled) warnings.push("Pro satın alma kapalı.");
  if (!process.env.ANTHROPIC_API_KEY) warnings.push("ANTHROPIC_API_KEY tanımlı değil — AI butonları 'henüz açık değil' der.");
  if (!statsRes.error && statsRes.data && s.credits_today === undefined) warnings.push("Migration 0007 (kredi sistemi) uygulanmamış — supabase/migrations/0007_credits.sql'i SQL Editor'da çalıştır.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) warnings.push("SUPABASE_SERVICE_ROLE_KEY yok — token/kredi kayıtları ve ziyaretçi istatistikleri tutulamaz.");
  const err = statsRes.error?.message;

  return (
    <>
      <PageTitle title="Genel bakış" subtitle={`Son ${CHANGELOG[0].version} sürümü: ${CHANGELOG[0].title}`} />

      {err && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          İstatistikler okunamadı: {err}. Migration 0005 uygulanmamış olabilir (supabase/migrations/0005_admin.sql).
        </div>
      )}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200 space-y-1">
          {warnings.map((w) => (
            <div key={w}>⚠ {w}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Kullanıcı" value={fmtNum(s.users_total)} hint={`+${fmtNum(s.users_7d)} son 7 gün • +${fmtNum(s.users_30d)} son 30 gün`} />
        <Stat label="Pro" value={fmtNum(s.users_pro)} hint={`${fmtNum(s.subs_active)} aktif abonelik • ${fmtNum(s.pro_interest)} ilgi bildirimi`} tone="lime" />
        <Stat label="MRR (tahmini)" value={`$${mrr.toFixed(0)}`} hint={`${fmtNum(s.subs_monthly)} aylık • ${fmtNum(s.subs_yearly)} yıllık`} tone="violet" />
        <Stat
          label="AI kredisi"
          value={fmtNum(s.credits_today ?? s.ai_today)}
          hint={`bugün • ${fmtNum(s.credits_month ?? s.ai_month)} bu ay • ${fmtNum(s.ai_today)} çağrı (${fmtNum(s.ai_anon_today)} ziyaretçi)`}
        />
        <Stat label="Üretim" value={fmtNum(s.generations_today)} hint={`bugün • ${fmtNum(s.generations_7d)} / 7 gün • ${fmtNum(s.generations_total)} toplam`} />
        <Stat label="Proje" value={fmtNum(s.projects_total)} hint={`+${fmtNum(s.projects_7d)} son 7 gün`} />
        <Stat label="Paylaşım" value={fmtNum(s.shares_total)} hint={`${fmtNum(s.share_views)} görüntülenme`} />
        <Stat label="İptal / süresi dolan" value={fmtNum(s.subs_cancelled)} hint={`${fmtNum(s.users_banned)} yasaklı hesap`} tone={s.subs_cancelled ? "red" : "default"} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Son 14 gün — kayıt & üretim" actions={<Legend items={[["#A3FF12", "Kayıt"], ["#8B5CF6", "Üretim"]]} />}>
          <Bars series={[daily.map((d) => d.signups), daily.map((d) => d.generations)]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12", "#8B5CF6"]} />
        </Panel>
        <Panel title="Son 14 gün — AI çağrıları" actions={<Legend items={[["#A3FF12", "Enhance"], ["#8B5CF6", "Stack"], ["#FF6B6B", "İyileştir"]]} />}>
          <Bars series={[daily.map((d) => d.ai_enhance), daily.map((d) => d.ai_suggest), daily.map((d) => d.ai_refine)]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12", "#8B5CF6", "#FF6B6B"]} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Son üretimler"
          actions={
            <Link href="/admin/users" className="text-[12px] text-zinc-400 hover:text-white flex items-center gap-1">
              Kullanıcılar <ArrowRight className="w-3 h-3" aria-hidden />
            </Link>
          }
        >
          {gens.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz üretim yok.</p>
          ) : (
            <Table head={["Zaman", "Kullanıcı", "Proje", "Tip", "v", "Format", "Uzman"]}>
              {gens.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{fmtDate(g.created_at, true)}</td>
                  <td className="px-4 py-2 truncate max-w-[220px]">{g.email}</td>
                  <td className="px-4 py-2 truncate max-w-[200px] font-medium">{g.name || "Adsız"}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-400">{projectTypeName(g.project_type)}</td>
                  <td className="px-4 py-2 font-mono">v{g.version}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Badge>{g.format}</Badge>
                  </td>
                  <td className="px-4 py-2">{g.experts.length}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /> {l}
        </span>
      ))}
    </div>
  );
}
