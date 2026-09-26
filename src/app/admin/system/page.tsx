import { getCloudflareContext } from "@opennextjs/cloudflare";
import { billingConfigured, variantFor } from "@/lib/billing/lemonsqueezy";
import { adminEmails } from "@/lib/admin";
import { CHANGELOG } from "@/lib/changelog";
import { readAllSettings } from "@/lib/settings-server";
import { adminConfigured } from "@/lib/supabase/admin";
import { Badge, Panel, PageTitle } from "@/components/admin/ui";
import { AiTest } from "@/components/admin/AiTest";
import Link from "next/link";

export const dynamic = "force-dynamic";

function versionInfo(): { id: string; tag: string; timestamp: string } | null {
  try {
    const { env } = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const v = env?.CF_VERSION_METADATA as { id?: string; tag?: string; timestamp?: string } | undefined;
    if (!v?.id) return null;
    return { id: v.id, tag: v.tag ?? "", timestamp: v.timestamp ?? "" };
  } catch {
    return null;
  }
}

export default async function AdminSystem() {
  const v = versionInfo();
  const settings = await readAllSettings();
  let variants: { monthly?: string; yearly?: string; error?: string } = {};
  if (billingConfigured()) {
    try {
      variants = { monthly: await variantFor("monthly"), yearly: await variantFor("yearly") };
    } catch (e) {
      variants = { error: e instanceof Error ? e.message : "hata" };
    }
  }
  const checks: { label: string; ok: boolean; hint: string }[] = [
    { label: "Supabase (URL + anon key)", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), hint: "Hesaplar, kütüphane, kotalar" },
    { label: "SUPABASE_SERVICE_ROLE_KEY", ok: adminConfigured(), hint: "Ödeme webhook'u plan yazabilsin" },
    { label: "ANTHROPIC_API_KEY", ok: Boolean(process.env.ANTHROPIC_API_KEY), hint: "Enhance / stack öner / iyileştir" },
    { label: "Lemon Squeezy (API key + store)", ok: billingConfigured(), hint: `Mağaza ${process.env.LEMONSQUEEZY_STORE_ID ?? "?"} • variant aylık ${variants.monthly ?? "?"} / yıllık ${variants.yearly ?? "?"}${variants.error ? " • " + variants.error : ""}` },
    { label: "LEMONSQUEEZY_WEBHOOK_SECRET", ok: Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET), hint: "X-Signature doğrulaması" },
    { label: "KV RATE_LIMIT", ok: true, hint: "Ziyaretçi (anonim) günlük kota" },
    { label: "Analitik (GA4 / Ads / Meta)", ok: Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID), hint: `GA ${process.env.NEXT_PUBLIC_GA_ID ? "✓" : "—"} • Ads ${process.env.NEXT_PUBLIC_GADS_ID ? "✓" : "—"} • Meta ${process.env.NEXT_PUBLIC_META_PIXEL_ID ? "✓" : "—"}` },
  ];
  const model = String(settings.values.ai_model || process.env.ANTHROPIC_MODEL || "claude-sonnet-5");

  return (
    <>
      <PageTitle title="Sistem" subtitle="Canlı sürüm, ortam kontrolleri, AI bağlantı testi ve sürüm notları." />

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Canlı sürüm">
          {v ? (
            <dl className="text-[13px] space-y-1.5">
              <Row k="Worker sürümü" v={<code className="text-lime">{v.id.slice(0, 8)}</code>} />
              <Row k="Etiket" v={v.tag || "—"} />
              <Row k="Dağıtım zamanı" v={v.timestamp ? new Date(v.timestamp).toLocaleString("tr-TR") : "—"} />
              <Row k="Ürün sürümü" v={`${CHANGELOG[0].version} — ${CHANGELOG[0].date}`} />
            </dl>
          ) : (
            <p className="text-[13px] text-zinc-500">Sürüm bilgisi yok (yerel çalıştırma ya da version_metadata bağlaması yok). Ürün sürümü: {CHANGELOG[0].version}.</p>
          )}
          <p className="mt-3 text-[12px] text-zinc-500">
            Yöneticiler: profiles.role = admin{adminEmails().length ? ` + ADMIN_EMAILS (${adminEmails().length})` : ""}. Yeni admin atamak için{" "}
            <Link href="/admin/users" className="text-lime hover:underline">
              Kullanıcılar
            </Link>
            .
          </p>
        </Panel>

        <Panel title="Ortam kontrolleri">
          <ul className="space-y-2 text-[13px]">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <Badge tone={c.ok ? "lime" : "red"}>{c.ok ? "OK" : "YOK"}</Badge>
                <div className="min-w-0">
                  <div className="font-medium">{c.label}</div>
                  <div className="text-[11px] text-zinc-500 break-words">{c.hint}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="AI bağlantı testi">
          <AiTest model={model} />
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Sürüm notları">
          <ol className="space-y-4">
            {CHANGELOG.map((c) => (
              <li key={c.version} className="grid md:grid-cols-[120px_1fr] gap-2">
                <div>
                  <div className="text-[13px] font-bold">v{c.version}</div>
                  <div className="text-[11px] text-zinc-500">{c.date}</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{c.title}</div>
                  <ul className="mt-1 text-[12px] text-zinc-400 space-y-0.5 list-disc pl-4">
                    {c.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  {c.settings && c.settings.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.settings.map((k) => (
                        <Link key={k} href="/admin/settings" className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-800 border border-ink-600 text-zinc-400 hover:text-lime">
                          {k}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-[140px] shrink-0 text-zinc-500">{k}</dt>
      <dd className="min-w-0">{v}</dd>
    </div>
  );
}
