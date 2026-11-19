import Link from "next/link";
import { getAdmin } from "@/lib/admin";
import { emailConfigFrom } from "@/lib/email/lifecycle";
import { renderLifecycleEmail, type EmailKind, type EmailLocale } from "@/lib/email/templates";
import { isMissingFunction } from "@/lib/share";
import { cx } from "@/lib/cx";
import { Badge, PageTitle, Panel, Stat, Table, fmtDate, fmtNum } from "@/components/admin/ui";
import { EmailActions } from "@/components/admin/EmailActions";

export const dynamic = "force-dynamic";

type Overview = { kind: string; status: string; n: number };
type Recent = {
  id: number;
  kind: string;
  status: string;
  attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string | null;
  email: string | null;
  locale: string | null;
  opted_out: boolean;
};
type Due = { kind: string; n: number };

const KIND_LABEL: Record<string, string> = { welcome: "Karşılama", nudge: "Başlangıç hatırlatması" };
const PREVIEWS: { id: string; label: string }[] = [
  { id: "welcome-tr", label: "Karşılama · TR" },
  { id: "welcome-en", label: "Karşılama · EN" },
  { id: "nudge-tr", label: "Hatırlatma · TR" },
  { id: "nudge-en", label: "Hatırlatma · EN" },
];

type Props = { searchParams: Promise<{ preview?: string }> };

/** Admin → E-postalar (0023): welcome + one getting-started reminder via Resend — status, numbers, previews, test send. */
export default async function AdminEmails({ searchParams }: Props) {
  const { preview = "welcome-tr" } = await searchParams;
  const admin = (await getAdmin())!;
  const [ov, rc, du] = await Promise.all([
    admin.supabase.rpc("admin_email_overview", { p_days: 30 }),
    admin.supabase.rpc("admin_email_recent", { p_limit: 50 }),
    admin.supabase.rpc("admin_email_due"),
  ]);
  const missing = [ov, rc, du].some((r) => isMissingFunction(r.error?.message));
  const err = missing ? null : (ov.error?.message ?? rc.error?.message ?? du.error?.message ?? null);
  const overview = (ov.data ?? []) as Overview[];
  const recent = (rc.data ?? []) as Recent[];
  const due = (du.data ?? []) as Due[];

  const count = (kind: string, status: string) => overview.filter((o) => o.kind === kind && o.status === status).reduce((a, o) => a + o.n, 0);
  const failed = count("welcome", "failed") + count("nudge", "failed") + count("welcome", "stuck") + count("nudge", "stuck");
  const dueTotal = due.reduce((a, d) => a + d.n, 0);

  const hasKey = Boolean(process.env.RESEND_API_KEY);
  const paused = (process.env.LIFECYCLE_EMAILS || "").trim().toLowerCase() === "off";
  const enabled = Boolean(emailConfigFrom(process.env));
  const from = process.env.EMAIL_FROM || "Prompt.Monster <hello@prompter.monster>";
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

  const [pk, pl] = preview.split("-");
  const kind: EmailKind = pk === "nudge" ? "nudge" : "welcome";
  const loc: EmailLocale = pl === "en" ? "en" : "tr";
  const sample = renderLifecycleEmail(kind, { name: loc === "en" ? "Alex" : "Deniz", locale: loc, token: "00000000-0000-4000-8000-000000000000" }, site);

  return (
    <>
      <PageTitle
        title="E-postalar"
        subtitle="Karşılama ve tek seferlik başlangıç hatırlatması (Resend). Saatlik cron (her saat :17) gönderir; karşılama ayrıca girişten hemen sonra gider. Aynı e-posta bir kişiye iki kez gitmez."
      />
      {missing && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200">
          Migration 0023 henüz uygulanmamış (supabase/migrations/0023_lifecycle_emails.sql) — Supabase SQL Editor&apos;da çalıştırınca bu sayfa dolar.
        </div>
      )}
      {!hasKey && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200 leading-relaxed">
          <strong>E-postalar kapalı: RESEND_API_KEY tanımlı değil.</strong> Açmak için: Resend → API Keys → Create API key (izin: Sending access, alan adı:
          prompter.monster) → anahtarı kopyala → Cloudflare → Workers &amp; Pages → prompter-monster → Settings → Variables and Secrets → Add → tür: Secret, ad:
          RESEND_API_KEY → Deploy. Sonra bu sayfadan kendine test gönder.
        </div>
      )}
      {paused && hasKey && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200">Duraklatıldı: LIFECYCLE_EMAILS = off.</div>
      )}
      {err && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">{err}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Karşılama" value={fmtNum(count("welcome", "sent"))} hint="gönderildi · son 30 gün" tone="lime" />
        <Stat label="Hatırlatma" value={fmtNum(count("nudge", "sent"))} hint="gönderildi · son 30 gün" />
        <Stat label="Sırada" value={fmtNum(dueTotal)} hint={due.length ? due.map((d) => `${KIND_LABEL[d.kind] ?? d.kind}: ${d.n}`).join(" · ") : "bir sonraki çalışmada"} />
        <Stat label="Çıkış yapan" value={fmtNum(count("optout", "total"))} hint={failed ? `${failed} başarısız / takıldı` : "toplam"} tone={failed ? "red" : "default"} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Durum ve kurallar">
          <ul className="space-y-2 text-[13px]">
            <li className="flex items-center gap-2">
              <Badge tone={hasKey ? "lime" : "red"}>{hasKey ? "OK" : "YOK"}</Badge> RESEND_API_KEY
            </li>
            <li className="flex items-center gap-2">
              <Badge tone={enabled ? "lime" : "amber"}>{enabled ? "AÇIK" : "KAPALI"}</Badge> Gönderim {paused ? "(LIFECYCLE_EMAILS = off)" : ""}
            </li>
            <li className="text-zinc-400">
              Gönderen: <code className="text-zinc-200">{from}</code>
            </li>
          </ul>
          <ul className="mt-4 space-y-1.5 text-[12.5px] text-zinc-400 list-disc pl-5">
            <li>
              <span className="text-zinc-200">Karşılama:</span> e-postası doğrulanmış, kaydının ilk 3 gününde olan hesaba bir kez.
            </li>
            <li>
              <span className="text-zinc-200">Hatırlatma:</span> 1–7 günlük, hiç proje kaydetmemiş hesaba bir kez; karşılamadan en az 20 saat sonra.
            </li>
            <li>Çıkış yapan, yasaklı ya da e-postası doğrulanmamış hesaba gitmez. Başarısız gönderim 1 saat arayla en fazla 3 kez denenir.</li>
            <li>İçerik yalnız kullanım bilgilendirmesi: kampanya, indirim ya da Pro tanıtımı eklemeyin (gizlilik metni bunu taahhüt ediyor).</li>
          </ul>
        </Panel>
        <Panel title="İşlemler">
          <EmailActions enabled={enabled && !missing} adminEmail={admin.user.email} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Son gönderimler">
          {recent.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Henüz gönderim yok.</p>
          ) : (
            <Table head={["Zaman", "Kullanıcı", "E-posta", "Durum", "Deneme", "Dil", "Not"]}>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-1.5 whitespace-nowrap text-zinc-400">{fmtDate(r.updated_at, true)}</td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <Link href={`/admin/users?q=${encodeURIComponent(r.email ?? r.username ?? "")}`} className="hover:text-lime">
                      {r.username ? `@${r.username}` : (r.email ?? r.user_id.slice(0, 8))}
                    </Link>
                    {r.opted_out && (
                      <span className="ml-2">
                        <Badge tone="amber">çıktı</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td className="px-4 py-1.5">
                    <Badge tone={r.status === "sent" ? "lime" : r.status === "failed" ? "red" : "amber"}>
                      {r.status === "sent" ? "gönderildi" : r.status === "failed" ? "başarısız" : "sırada"}
                    </Badge>
                  </td>
                  <td className="px-4 py-1.5 tabular-nums">{r.attempts}</td>
                  <td className="px-4 py-1.5 uppercase text-zinc-400">{r.locale ?? "—"}</td>
                  <td className="px-4 py-1.5 text-zinc-500 max-w-[320px] truncate" title={r.error ?? ""}>
                    {r.error ?? ""}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Önizleme"
          actions={
            <div className="flex flex-wrap gap-1">
              {PREVIEWS.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/emails?preview=${p.id}`}
                  className={cx(
                    "h-7 px-2.5 rounded-md text-[11.5px] flex items-center border",
                    p.id === `${kind}-${loc}` ? "bg-ink-800 border-ink-400 text-white" : "border-transparent text-zinc-400 hover:text-white",
                  )}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          }
        >
          <div className="text-[13px]">
            <div>
              <span className="text-zinc-500">Konu:</span> <span className="font-semibold">{sample.subject}</span>
            </div>
            <div className="mt-0.5">
              <span className="text-zinc-500">Önizleme metni:</span> <span className="text-zinc-300">{sample.preheader}</span>
            </div>
          </div>
          <iframe
            title="E-posta önizlemesi"
            srcDoc={sample.html}
            sandbox=""
            className="mt-3 w-full h-[860px] rounded-xl border border-ink-600 bg-white"
          />
          <details className="mt-3 text-[12px]">
            <summary className="cursor-pointer text-zinc-400 hover:text-white">Düz metin sürümü</summary>
            <pre tabIndex={0} className="mt-2 p-3 rounded-lg bg-ink-950 border border-ink-600 whitespace-pre-wrap text-zinc-300">
              {sample.text}
            </pre>
          </details>
          <p className="mt-2 text-[11.5px] text-zinc-500">Örnek isim ve sahte çıkış bağlantısıyla gösterilir; gerçek gönderimde kişinin adı ve kendi bağlantısı kullanılır.</p>
        </Panel>
      </div>
    </>
  );
}
