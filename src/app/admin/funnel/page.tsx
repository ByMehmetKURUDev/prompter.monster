import { getAdmin } from "@/lib/admin";
import { channelOf } from "@/lib/attribution";
import { isMissingFunction } from "@/lib/share";
import { Bars, PageTitle, Panel, Stat, Table, fmtNum } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type FunnelRow = {
  is_total: boolean;
  source: string | null;
  referrer: string | null;
  code: string | null;
  invited: boolean | null;
  signups: number;
  saved: number;
  generated: number;
  used_ai: number;
  shared: number;
  pro_interest: number;
  paid: number;
  gen_hours_median: number | string | null;
};
type DailyRow = { day: string; signups: number; generators: number; generations: number; ai_calls: number; shares: number; pro_interest: number };
type StepKey = "signups" | "saved" | "generated" | "used_ai" | "shared" | "pro_interest" | "paid";
type Counts = Record<StepKey, number>;

/** `chain`: a strict subset of the previous step (a saved version needs a saved project), so "share of previous" is meaningful. */
const STEPS: { key: StepKey; label: string; hint: string; chain?: boolean }[] = [
  { key: "signups", label: "Kayıt", hint: "Seçilen dönemde hesap açanlar (kohort)" },
  { key: "saved", label: "Proje kaydetti", hint: "En az bir projeyi kütüphanesine kaydetti", chain: true },
  { key: "generated", label: "Prompt üretti", hint: "En az bir versiyon üretti (kayıtlı üretim)", chain: true },
  { key: "used_ai", label: "AI kullandı", hint: "Enhance / öneri / iyileştir — başarılı en az bir çağrı" },
  { key: "shared", label: "Paylaştı", hint: "En az bir paylaşım bağlantısı oluşturdu" },
  { key: "pro_interest", label: "Pro ilgisi", hint: "'Pro açılınca haber al' dedi" },
  { key: "paid", label: "Ödeyen (Pro)", hint: "Kişisel Pro planı ya da aktif abonelik" },
];

const DAYS = [7, 30, 90, 365];
const pct = (n: number, d: number) => (d ? `%${((n / d) * 100).toFixed(n && n < d / 100 ? 1 : 0)}` : "—");
const empty = (): Counts => ({ signups: 0, saved: 0, generated: 0, used_ai: 0, shared: 0, pro_interest: 0, paid: 0 });

type Props = { searchParams: Promise<{ days?: string }> };

/** Admin → Huni (0022): sign-up cohort → project → generation → AI → share → Pro interest → paid, by channel and by day. */
export default async function AdminFunnel({ searchParams }: Props) {
  const { days = "30" } = await searchParams;
  const d = DAYS.includes(Number(days)) ? Number(days) : 30;
  const admin = (await getAdmin())!;
  const [fRes, dRes] = await Promise.all([
    admin.supabase.rpc("admin_funnel", { p_days: d }),
    admin.supabase.rpc("admin_activity_daily", { p_days: d, p_tz: "Europe/Istanbul" }),
  ]);
  const missing = isMissingFunction(fRes.error?.message) || isMissingFunction(dRes.error?.message);
  const err = missing ? null : (fRes.error?.message ?? dRes.error?.message ?? null);
  const rows = (fRes.data ?? []) as FunnelRow[];
  const daily = (dRes.data ?? []) as DailyRow[];

  const totalRow = rows.find((r) => r.is_total);
  const total: Counts = totalRow ? { ...totalRow } : empty();
  const median = totalRow?.gen_hours_median != null ? Number(totalRow.gen_hours_median) : null;

  // Channels: same labelling as Admin → Kanallar; invite-only sign-ups get their own bucket.
  const byChannel = new Map<string, Counts>();
  for (const r of rows) {
    if (r.is_total) continue;
    const src = { s: r.source || undefined, r: r.referrer || undefined, code: r.code || undefined };
    const label = r.invited && !r.source && !r.referrer && !r.code ? "davet (arkadaşını getir)" : channelOf(src);
    const cur = byChannel.get(label) ?? empty();
    for (const s of STEPS) cur[s.key] += r[s.key];
    byChannel.set(label, cur);
  }
  const channels = [...byChannel.entries()].sort((a, b) => b[1].signups - a[1].signups);
  const labels = daily.map((x) => x.day.slice(5));

  return (
    <>
      <PageTitle
        title="Huni"
        subtitle="Kayıt olanlar sonra ne yaptı? Seçilen dönemde kaydolan kullanıcıların proje, üretim, AI, paylaşım, Pro ilgisi ve ödeme adımlarına ulaşma oranı; kanal ve gün bazında."
        actions={
          <form className="flex gap-2" action="/admin/funnel">
            <select name="days" defaultValue={String(d)} aria-label="Dönem" className="h-9 px-2 rounded-lg bg-ink-900 border border-ink-600 text-[13px]">
              {DAYS.map((n) => (
                <option key={n} value={n}>
                  Son {n} gün
                </option>
              ))}
            </select>
            <button className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[13px] hover:border-ink-400">Göster</button>
          </form>
        }
      />
      {missing && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200">
          Migration 0022 henüz uygulanmamış (supabase/migrations/0022_admin_funnel.sql) — Supabase SQL Editor&apos;da çalıştırınca bu sayfa dolar.
        </div>
      )}
      {err && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{err}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Kayıt" value={fmtNum(total.signups)} hint={`son ${d} gün`} />
        <Stat label="Aktivasyon" value={pct(total.generated, total.signups)} hint={`${fmtNum(total.generated)} kişi prompt üretti`} tone="lime" />
        <Stat
          label="İlk üretime süre"
          value={median == null ? "—" : median < 1 ? `${Math.max(1, Math.round(median * 60))} dk` : median < 48 ? `${median.toFixed(1)} sa` : `${(median / 24).toFixed(1)} gün`}
          hint="kayıttan ilk versiyona (medyan)"
        />
        <Stat label="Ödeyen" value={fmtNum(total.paid)} hint={total.signups ? `dönüşüm ${pct(total.paid, total.signups)}` : undefined} tone="violet" />
      </div>

      <div className="mt-6">
        <Panel title="Adım adım (kayıtlara oranla)">
          {total.signups === 0 ? (
            <p className="text-[13px] text-zinc-500">Bu dönemde kayıt yok.</p>
          ) : (
            <ol className="space-y-2.5">
              {STEPS.map((s, i) => {
                const n = total[s.key];
                const w = Math.max(n ? 2 : 0, Math.round((n / total.signups) * 100));
                const prev = i > 0 ? total[STEPS[i - 1].key] : null;
                return (
                  <li key={s.key} className="grid grid-cols-[150px_minmax(0,1fr)_120px] items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{s.label}</div>
                      <div className="text-[11px] text-zinc-500 truncate" title={s.hint}>
                        {s.hint}
                      </div>
                    </div>
                    <div className="h-7 rounded-lg bg-ink-800 border border-ink-600 overflow-hidden" aria-hidden>
                      <div className={i === 0 ? "h-full bg-zinc-500/60" : s.key === "paid" ? "h-full bg-violet" : "h-full bg-lime/80"} style={{ width: `${w}%` }} />
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="text-[14px] font-bold">{fmtNum(n)}</span>
                      <span className="ml-1.5 text-[12px] text-zinc-400">{pct(n, total.signups)}</span>
                      {s.chain && prev != null && prev > 0 && <div className="text-[10.5px] text-zinc-500">önceki adımın {pct(n, prev)}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Günlük kayıt ve üreten kişi">
          {daily.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Veri yok.</p>
          ) : (
            <>
              <Bars series={[daily.map((x) => x.signups), daily.map((x) => x.generators)]} labels={labels} colors={["#8A8A94", "#A3FF12"]} />
              <div className="mt-2 flex gap-4 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8A8A94]" /> kayıt
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-lime" /> prompt üreten kişi
                </span>
              </div>
            </>
          )}
        </Panel>
        <Panel title="Günlük AI çağrısı ve paylaşım">
          {daily.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Veri yok.</p>
          ) : (
            <>
              <Bars series={[daily.map((x) => x.ai_calls), daily.map((x) => x.shares)]} labels={labels} colors={["#8B5CF6", "#38BDF8"]} />
              <div className="mt-2 flex gap-4 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet" /> AI çağrısı (ziyaretçiler dahil)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" /> paylaşım
                </span>
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Kanal bazında huni">
          {channels.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Bu dönemde kayıt yok.</p>
          ) : (
            <Table head={["Kanal", "Kayıt", "Proje", "Üretim", "AI", "Paylaşım", "Pro ilgisi", "Ödeyen", "Aktivasyon"]}>
              {channels.map(([name, c]) => (
                <tr key={name}>
                  <td className="px-4 py-1.5 font-medium whitespace-nowrap">{name}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.signups)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.saved)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.generated)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.used_ai)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.shared)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.pro_interest)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{fmtNum(c.paid)}</td>
                  <td className="px-4 py-1.5 tabular-nums text-zinc-400">{pct(c.generated, c.signups)}</td>
                </tr>
              ))}
            </Table>
          )}
          <p className="mt-3 text-[11.5px] text-zinc-500">
            Kanal, kayıttaki ilk dokunuş kaynağıdır (utm_source, ref, dış site ya da ?code=); etiketler Kanallar sayfasıyla aynı. Ziyaretçi davranışı (kayıt
            olmadan üretim) burada yok — o veriler GA4&apos;te.
          </p>
        </Panel>
      </div>
    </>
  );
}
