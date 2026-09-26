import { getAdmin } from "@/lib/admin";
import { readAllSettings } from "@/lib/settings-server";
import { Bars, Panel, PageTitle, Stat, Table, fmtNum } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Daily = { day: string; signups: number; generations: number; ai_calls: number; ai_enhance: number; ai_suggest: number; ai_refine: number };

/** Rough per-call cost model (USD) — see docs: enhance ≈ 1.5k in / 0.6k out, suggest ≈ 1k / 0.3k, refine ≈ 4k / 3k. */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-5": { input: 5, output: 25 },
};
const TOKENS = { enhance: { i: 1500, o: 600 }, suggest: { i: 1000, o: 300 }, refine: { i: 4000, o: 3000 } };

function costOf(model: string, e: number, s: number, r: number): number {
  const p = PRICES[model] ?? PRICES["claude-sonnet-5"];
  const tok = (n: number, t: { i: number; o: number }) => (n * t.i * p.input + n * t.o * p.output) / 1_000_000;
  return tok(e, TOKENS.enhance) + tok(s, TOKENS.suggest) + tok(r, TOKENS.refine);
}

export default async function AdminUsage() {
  const admin = (await getAdmin())!;
  const [{ data, error }, settings] = await Promise.all([admin.supabase.rpc("admin_daily", { p_days: 30 }), readAllSettings()]);
  const daily = (data ?? []) as Daily[];
  const model = String(settings.values.ai_model || process.env.ANTHROPIC_MODEL || "claude-sonnet-5");
  const sum = (k: keyof Daily) => daily.reduce((a, d) => a + Number(d[k] ?? 0), 0);
  const e = sum("ai_enhance");
  const s = sum("ai_suggest");
  const r = sum("ai_refine");
  const est = costOf(model, e, s, r);
  const perDayPro = Number(settings.values.pro_ai_per_day);
  const perMonthPro = Number(settings.values.pro_ai_per_month);
  const worstPro = costOf(model, 0, 0, Math.min(perDayPro * 30, perMonthPro)); // all refines at the monthly cap

  return (
    <>
      <PageTitle title="Kullanım ve maliyet" subtitle={`Son 30 gün. Maliyet tahmini ${model} fiyatlarıyla; gerçek fatura Anthropic konsolunda.`} />
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{error.message}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="AI çağrısı / 30g" value={fmtNum(sum("ai_calls"))} hint={`${fmtNum(e)} enhance • ${fmtNum(s)} stack • ${fmtNum(r)} refine`} />
        <Stat label="Tahmini maliyet / 30g" value={`$${est.toFixed(2)}`} hint="token varsayımlarıyla" tone="violet" />
        <Stat label="Pro tavan senaryosu" value={`$${worstPro.toFixed(0)}/ay`} hint={`1 Pro kullanıcı, ${fmtNum(Math.min(perDayPro * 30, perMonthPro))} refine (aylık tavan)`} tone={worstPro > 29 ? "red" : "lime"} />
        <Stat label="Üretim / 30g" value={fmtNum(sum("generations"))} hint={`${fmtNum(sum("signups"))} yeni kayıt`} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="AI çağrıları (günlük)">
          <Bars series={[daily.map((d) => d.ai_enhance), daily.map((d) => d.ai_suggest), daily.map((d) => d.ai_refine)]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12", "#8B5CF6", "#FF6B6B"]} />
          <div className="mt-2 text-[11px] text-zinc-500">yeşil: enhance • mor: stack öner • kırmızı: refine</div>
        </Panel>
        <Panel title="Kayıt ve üretim (günlük)">
          <Bars series={[daily.map((d) => d.signups), daily.map((d) => d.generations)]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12", "#8B5CF6"]} />
          <div className="mt-2 text-[11px] text-zinc-500">yeşil: kayıt • mor: üretim</div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Günlük tablo">
          <Table head={["Gün", "Kayıt", "Üretim", "AI", "Enhance", "Stack", "Refine", "Tahmini $"]}>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}>
                <td className="px-4 py-1.5 font-mono text-zinc-400">{d.day}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.signups}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.generations}</td>
                <td className="px-4 py-1.5 tabular-nums font-semibold">{d.ai_calls}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_enhance}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_suggest}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_refine}</td>
                <td className="px-4 py-1.5 tabular-nums text-zinc-400">${costOf(model, d.ai_enhance, d.ai_suggest, d.ai_refine).toFixed(3)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
