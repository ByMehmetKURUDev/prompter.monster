import { getAdmin } from "@/lib/admin";
import { costUsd, priceOf } from "@/lib/model-prices";
import { readAllSettings } from "@/lib/settings-server";
import { Badge, Bars, Panel, PageTitle, Stat, Table, fmtNum } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Daily = {
  day: string;
  signups: number;
  generations: number;
  ai_calls: number;
  ai_enhance: number;
  ai_suggest: number;
  ai_refine: number;
  credits?: number;
  tokens_in?: number;
  tokens_out?: number;
  anon_calls?: number;
  failed?: number;
};
type ModelRow = { model: string; plan: string; calls: number; credits: number; tokens_in: number; tokens_out: number };

/** Typical token use per action (for the "what does a credit cost" estimate when there is no data yet). */
const TYPICAL = { enhance: { i: 300, o: 250 }, suggest: { i: 700, o: 150 }, refine: { i: 1500, o: 2500 } };

export default async function AdminUsage() {
  const admin = (await getAdmin())!;
  const [dailyRes, modelsRes, settings] = await Promise.all([
    admin.supabase.rpc("admin_daily", { p_days: 30 }),
    admin.supabase.rpc("admin_usage_models", { p_days: 30 }),
    readAllSettings(),
  ]);
  const daily = (dailyRes.data ?? []) as Daily[];
  const models = (modelsRes.data ?? []) as ModelRow[];
  const v = settings.values;
  const sum = (k: keyof Daily) => daily.reduce((a, d) => a + Number(d[k] ?? 0), 0);

  const realCost = models.reduce((a, m) => a + (costUsd(m.model, Number(m.tokens_in), Number(m.tokens_out)) ?? 0), 0);
  const tokensIn = models.reduce((a, m) => a + Number(m.tokens_in), 0);
  const tokensOut = models.reduce((a, m) => a + Number(m.tokens_out), 0);
  const credits = sum("credits");

  // Worst case for one Pro user: the whole monthly allowance spent on refines at the typical/max output.
  const proModel = String(v.ai_model_pro || "claude-sonnet-5");
  const freeModel = String(v.ai_model_free || "claude-haiku-4-5");
  const refineCost = Number(v.credit_cost_refine) || 3;
  const monthRefines = Math.floor(Number(v.pro_credits_per_month) / refineCost);
  const typicalRefine = costUsd(proModel, TYPICAL.refine.i, TYPICAL.refine.o) ?? 0;
  const maxRefine = costUsd(proModel, 6000, Number(v.refine_max_tokens) || 4000) ?? 0;
  const proTypical = monthRefines * typicalRefine;
  const proWorst = monthRefines * maxRefine;
  const freeDaily = Number(v.free_credits_per_day);
  const freeWorstMonth = Math.floor(freeDaily / refineCost) * 30 * (costUsd(freeModel, 6000, Number(v.refine_max_tokens) || 4000) ?? 0);
  const net = 29 * 0.95 - 0.5; // Lemon Squeezy 5% + $0.50 per monthly payment (before extra fees)
  const migrationMissing = modelsRes.error?.message?.includes("admin_usage_models");

  return (
    <>
      <PageTitle title="Kullanım ve maliyet" subtitle="Son 30 gün. Maliyet, her çağrının gerçek token sayısı ve model fiyatlarıyla hesaplanır (Anthropic liste fiyatı)." />
      {(dailyRes.error || modelsRes.error) && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          {migrationMissing ? "Migration 0007 (kredi sistemi) henüz uygulanmamış: supabase/migrations/0007_credits.sql" : (dailyRes.error ?? modelsRes.error)?.message}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Gerçek maliyet / 30g" value={`$${realCost.toFixed(2)}`} hint={`${fmtNum(tokensIn)} giriş • ${fmtNum(tokensOut)} çıkış token`} tone="violet" />
        <Stat label="Harcanan kredi / 30g" value={fmtNum(credits)} hint={`${fmtNum(sum("ai_calls"))} çağrı • ${fmtNum(sum("anon_calls"))} ziyaretçi • ${fmtNum(sum("failed"))} iade`} />
        <Stat
          label="Pro kullanıcı başı (tahmini)"
          value={`$${proTypical.toFixed(2)}–${proWorst.toFixed(2)}/ay`}
          hint={`${fmtNum(monthRefines)} iyileştirme (tüm kredi) • ${proModel} • net gelir ≈ $${net.toFixed(2)}`}
          tone={proWorst > net ? "red" : "lime"}
        />
        <Stat label="Free kullanıcı en kötü" value={`$${freeWorstMonth.toFixed(2)}/ay`} hint={`günde ${freeDaily} kredi • ${freeModel}`} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Kredi (günlük)">
          <Bars series={[daily.map((d) => Number(d.credits ?? 0))]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12"]} />
        </Panel>
        <Panel title="AI çağrıları (günlük)">
          <Bars series={[daily.map((d) => d.ai_enhance), daily.map((d) => d.ai_suggest), daily.map((d) => d.ai_refine)]} labels={daily.map((d) => d.day.slice(5))} colors={["#A3FF12", "#8B5CF6", "#FF6B6B"]} />
          <div className="mt-2 text-[11px] text-zinc-500">yeşil: enhance • mor: stack öner • kırmızı: iyileştir</div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Model ve plan bazında (30 gün)">
          {models.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz token kaydı yok. AI anahtarı eklenip ilk çağrılar yapılınca burada gerçek maliyet görünür.</p>
          ) : (
            <Table head={["Model", "Plan", "Çağrı", "Kredi", "Giriş token", "Çıkış token", "Maliyet", "Çağrı başı"]}>
              {models.map((m) => {
                const c = costUsd(m.model, Number(m.tokens_in), Number(m.tokens_out));
                return (
                  <tr key={`${m.model}-${m.plan}`}>
                    <td className="px-4 py-1.5 font-mono text-[12px]">{priceOf(m.model)?.label ?? m.model}</td>
                    <td className="px-4 py-1.5">
                      <Badge tone={m.plan === "pro" ? "lime" : m.plan === "anon" ? "amber" : "zinc"}>{m.plan}</Badge>
                    </td>
                    <td className="px-4 py-1.5 tabular-nums">{fmtNum(m.calls)}</td>
                    <td className="px-4 py-1.5 tabular-nums">{fmtNum(m.credits)}</td>
                    <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(m.tokens_in))}</td>
                    <td className="px-4 py-1.5 tabular-nums">{fmtNum(Number(m.tokens_out))}</td>
                    <td className="px-4 py-1.5 tabular-nums">{c == null ? "?" : `$${c.toFixed(3)}`}</td>
                    <td className="px-4 py-1.5 tabular-nums text-zinc-400">{c == null || !m.calls ? "—" : `$${(c / m.calls).toFixed(4)}`}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Günlük tablo">
          <Table head={["Gün", "Kayıt", "Üretim", "Çağrı", "Kredi", "Enhance", "Stack", "İyileştir", "Ziyaretçi", "İade"]}>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}>
                <td className="px-4 py-1.5 font-mono text-zinc-400">{d.day}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.signups}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.generations}</td>
                <td className="px-4 py-1.5 tabular-nums font-semibold">{d.ai_calls}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.credits ?? "—"}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_enhance}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_suggest}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.ai_refine}</td>
                <td className="px-4 py-1.5 tabular-nums">{d.anon_calls ?? "—"}</td>
                <td className="px-4 py-1.5 tabular-nums text-zinc-500">{d.failed ?? "—"}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
