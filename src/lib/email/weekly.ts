/**
 * Weekly admin summary (migration 0024): every Monday the hourly cron (custom-worker.ts, the 05:17 UTC run = 08:17
 * Istanbul) e-mails the admin accounts a short report of the last 7 days compared with the 7 days before.
 * Admin → E-postalar shows a preview and can send it to the signed-in admin.
 *
 * Plain fetch only — no supabase-js, Next or "@/" imports — so the worker can bundle it outside Next.
 * Off until RESEND_API_KEY exists; WEEKLY_SUMMARY = "off" turns it off on its own (LIFECYCLE_EMAILS doesn't).
 */
import { channelOf } from "../attribution";
import { baseEmailConfigFrom, emailRpc, sendViaResend, type EmailConfig } from "./lifecycle";
import { EMAIL_STYLE, emailShell, esc } from "./templates";

export interface WeeklySummary {
  days: number;
  from: string;
  to: string;
  recipients: string[];
  users_total: number;
  signups: number;
  signups_prev: number;
  active_users: number;
  active_users_prev: number;
  projects_new: number;
  generations: number;
  generations_prev: number;
  generators: number;
  ai_calls: number;
  ai_calls_prev: number;
  ai_anon: number;
  ai_failed: number;
  credits: number;
  tokens_in: number;
  tokens_out: number;
  shares_new: number;
  shares_listed_new: number;
  share_views_total: number;
  pro_interest_new: number;
  subs_active: number;
  subs_new: number;
  subs_ended_new: number;
  teams_active: number;
  teams_new: number;
  feedback_new: number;
  emails_sent: number;
  emails_failed: number;
  optouts_new: number;
  sources: { s: string; r: string; code: string; invited: boolean; n: number }[];
  top_types: { type: string; n: number }[];
}

export interface WeeklyResult {
  recipients: number;
  sent: number;
  failed: number;
  errors: string[];
}

/** Monday, the 05:xx UTC run of the hourly cron (08:17 in Istanbul). */
export const WEEKLY_DAY_UTC = 1;
export const WEEKLY_HOUR_UTC = 5;

export function isWeeklySlot(d: Date): boolean {
  return d.getUTCDay() === WEEKLY_DAY_UTC && d.getUTCHours() === WEEKLY_HOUR_UTC;
}

/** Null → off (no Resend key, no service key, or WEEKLY_SUMMARY = off). */
export function weeklyConfigFrom(env: Record<string, unknown>): EmailConfig | null {
  const flag = typeof env.WEEKLY_SUMMARY === "string" ? env.WEEKLY_SUMMARY.trim().toLowerCase() : "";
  if (flag === "off") return null;
  return baseEmailConfigFrom(env);
}

export function fetchWeeklySummary(cfg: Pick<EmailConfig, "supabaseUrl" | "serviceKey">, days = 7): Promise<WeeklySummary> {
  return emailRpc<WeeklySummary>(cfg, "admin_weekly_summary", { p_days: days });
}

/* ---- rendering (Turkish: the admins read it) ---- */

const TZ = "Europe/Istanbul";
const num = (n: number) => new Intl.NumberFormat("tr-TR").format(Math.round(n || 0));

/** "12–19 Kasım 2026" or "28 Ekim – 4 Kasım 2026" (Istanbul days). */
export function weeklyRange(fromIso: string, toIso: string): string {
  const parts = (iso: string) => {
    const p = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).formatToParts(new Date(iso));
    const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
    return { day: get("day"), month: get("month"), year: get("year") };
  };
  const a = parts(fromIso);
  const b = parts(toIso);
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day}–${b.day} ${b.month} ${b.year}`;
}

type Delta = { text: string; tone: "up" | "down" | "flat" };

/** Change vs the previous period: "▲ %50", "▼ %20", "yeni" (from zero), "—" (no change). */
export function delta(cur: number, prev: number): Delta {
  if (cur === prev) return { text: "—", tone: "flat" };
  if (!prev) return { text: "yeni", tone: "up" };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return pct >= 0 ? { text: `▲ %${pct}`, tone: "up" } : { text: `▼ %${Math.abs(pct)}`, tone: "down" };
}

/** Sign-up channels with the same labels as Admin → Kanallar; invites have their own row. */
export function weeklyChannels(sources: WeeklySummary["sources"], top = 5): { label: string; n: number }[] {
  const by = new Map<string, number>();
  for (const x of sources) {
    const label = x.invited ? "davet linki" : channelOf({ s: x.s || undefined, r: x.r || undefined, code: x.code || undefined });
    by.set(label, (by.get(label) ?? 0) + x.n);
  }
  return [...by.entries()]
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, top);
}

export function renderWeeklySummary(s: WeeklySummary, site: string): { subject: string; preheader: string; html: string; text: string } {
  const { FONT, INK, LIME, LINK, TEXT, MUTED } = EMAIL_STYLE;
  const range = weeklyRange(s.from, s.to);
  const dSign = delta(s.signups, s.signups_prev);
  const dActive = delta(s.active_users, s.active_users_prev);
  const subject = `Prompter.Monster · haftalık özet (${range}): ${num(s.signups)} kayıt, ${num(s.generations)} üretim`;
  const preheader = `Kayıt ${dSign.text === "—" ? "değişmedi" : dSign.text}, aktif kullanıcı ${dActive.text === "—" ? "değişmedi" : dActive.text} (önceki 7 güne göre).`;

  type Row = { label: string; value: string; note?: string; d?: Delta };
  const rows: Row[] = [
    { label: "Yeni kayıt", value: num(s.signups), note: `toplam ${num(s.users_total)} hesap`, d: dSign },
    { label: "Aktif kullanıcı", value: num(s.active_users), note: "proje, üretim ya da AI", d: dActive },
    { label: "Prompt üretimi (versiyon)", value: num(s.generations), note: `${num(s.generators)} kişi`, d: delta(s.generations, s.generations_prev) },
    { label: "AI çağrısı", value: num(s.ai_calls), note: `${num(s.credits)} kredi · ziyaretçi ${num(s.ai_anon)}`, d: delta(s.ai_calls, s.ai_calls_prev) },
    { label: "Yeni proje", value: num(s.projects_new) },
    { label: "Paylaşım", value: num(s.shares_new), note: `galeride ${num(s.shares_listed_new)} · toplam görüntülenme ${num(s.share_views_total)}` },
    { label: "Pro ilgisi", value: num(s.pro_interest_new), note: `aktif abonelik ${num(s.subs_active)} · yeni ${num(s.subs_new)} · biten ${num(s.subs_ended_new)}` },
    { label: "Takım", value: num(s.teams_active), note: `aktif · yeni ${num(s.teams_new)}` },
    { label: "Bilgilendirme e-postası", value: num(s.emails_sent), note: `başarısız ${num(s.emails_failed)} · çıkan ${num(s.optouts_new)}` },
  ];
  const toneColor = (t: Delta["tone"]) => (t === "up" ? "#15803d" : t === "down" ? "#b91c1c" : MUTED);
  const cell = `padding:10px 0;border-bottom:1px solid #f0f0f2;font:14px/1.4 ${FONT};`;
  const table =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 20px;">` +
    rows
      .map(
        (r) =>
          `<tr><td style="${cell}color:${TEXT};">${esc(r.label)}${r.note ? `<br><span style="font-size:12px;color:${MUTED};">${esc(r.note)}</span>` : ""}</td>` +
          `<td align="right" style="${cell}color:${INK};font-weight:700;white-space:nowrap;padding-left:12px;">${esc(r.value)}</td>` +
          `<td align="right" style="${cell}white-space:nowrap;padding-left:12px;width:64px;font-size:12px;color:${r.d ? toneColor(r.d.tone) : MUTED};">${r.d ? esc(r.d.text) : ""}</td></tr>`,
      )
      .join("") +
    `</table>`;

  const h2 = (t: string) => `<h2 style="margin:22px 0 8px;font:700 15px/1.3 ${FONT};color:${TEXT};">${esc(t)}</h2>`;
  const list = (items: string[]) =>
    `<ul style="margin:0 0 6px;padding-left:20px;font:14px/1.6 ${FONT};color:${TEXT};">${items.map((i) => `<li style="margin:2px 0;">${i}</li>`).join("")}</ul>`;
  const channels = weeklyChannels(s.sources);
  const types = s.top_types.slice(0, 5);
  const link = (path: string, label: string) => `<a href="${esc(site + path)}" style="color:${LINK};text-decoration:underline;">${esc(label)}</a>`;

  const watch: string[] = [];
  if (s.ai_failed) watch.push(`${num(s.ai_failed)} başarısız AI çağrısı — ${link("/admin/usage", "Kullanım")}`);
  if (s.emails_failed) watch.push(`${num(s.emails_failed)} bilgilendirme e-postası gönderilemedi — ${link("/admin/emails", "E-postalar")}`);
  if (s.feedback_new) watch.push(`${num(s.feedback_new)} yeni bildirim — ${link("/admin/shares", "Paylaşımlar")}`);
  if (s.subs_ended_new) watch.push(`${num(s.subs_ended_new)} abonelik sona erdi — ${link("/admin/subscriptions", "Abonelikler")}`);

  const bodyHtml =
    `<h1 style="margin:0 0 6px;font:700 22px/1.3 ${FONT};color:${TEXT};letter-spacing:-0.3px;">Haftalık özet</h1>` +
    `<p style="margin:0 0 8px;font:14px/1.6 ${FONT};color:${MUTED};">Son ${num(s.days)} gün · ${esc(range)} · oklar önceki ${num(s.days)} güne göre</p>` +
    table +
    h2("Nereden geldiler") +
    (channels.length ? list(channels.map((c) => `${esc(c.label)} — <strong>${num(c.n)}</strong>`)) : `<p style="margin:0;font:14px/1.6 ${FONT};color:${MUTED};">Bu dönemde yeni kayıt yok.</p>`) +
    (types.length ? h2("En çok üretilen proje tipleri") + list(types.map((t) => `${esc(t.type)} — <strong>${num(t.n)}</strong>`)) : "") +
    (watch.length ? h2("Göz at") + list(watch) : "") +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px;"><tr><td bgcolor="${LIME}" style="border-radius:10px;background:${LIME};">` +
    `<a href="${esc(site)}/admin" style="display:inline-block;padding:12px 22px;font:700 14px/1.2 ${FONT};color:${INK};text-decoration:none;border-radius:10px;">Admin paneli &rarr;</a></td></tr></table>` +
    `<p style="margin:10px 0 0;font:13px/1.6 ${FONT};color:${MUTED};">${link("/admin/funnel", "Huni")} · ${link("/admin/channels", "Kanallar")} · ${link("/admin/emails", "E-postalar")} · ${link("/admin/usage", "Kullanım")}</p>`;
  const footerHtml = "Bu özet yalnız admin hesaplarına gider (her pazartesi 08:17, İstanbul). Kapatmak için Cloudflare'de WEEKLY_SUMMARY = off.";
  const html = emailShell({ locale: "tr", site, title: subject, preheader, bodyHtml, footerHtml: esc(footerHtml) });

  const text = [
    `Haftalık özet — son ${s.days} gün (${range})`,
    "",
    ...rows.map((r) => `${r.label}: ${r.value}${r.d && r.d.text !== "—" ? ` (${r.d.text})` : ""}${r.note ? ` — ${r.note}` : ""}`),
    "",
    "Nereden geldiler:",
    ...(channels.length ? channels.map((c) => `- ${c.label}: ${c.n}`) : ["- Bu dönemde yeni kayıt yok."]),
    ...(types.length ? ["", "En çok üretilen proje tipleri:", ...types.map((t) => `- ${t.type}: ${t.n}`)] : []),
    ...(watch.length ? ["", "Göz at:", ...watch.map((w) => `- ${w.replace(/<[^>]+>/g, "")}`)] : []),
    "",
    `Admin paneli: ${site}/admin`,
    "",
    footerHtml,
  ].join("\n");
  return { subject, preheader, html, text };
}

/** FNV-1a, to keep e-mail addresses out of the idempotency key. */
function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Fetches the numbers and e-mails them. Default recipients: every admin account (from the database).
 * `test` sends to `to` only, with "[Test]" in the subject and a unique idempotency key.
 * The scheduled send uses one key per day and recipient, so a repeated cron run within 24 h sends nothing twice.
 */
export async function sendWeeklySummary(cfg: EmailConfig, opts: { to?: string[]; test?: boolean; now?: Date } = {}): Promise<WeeklyResult> {
  const summary = await fetchWeeklySummary(cfg, 7);
  const recipients = (opts.to ?? summary.recipients ?? []).filter((x) => typeof x === "string" && x.includes("@"));
  const mail = renderWeeklySummary(summary, cfg.siteUrl);
  const day = (opts.now ?? new Date()).toISOString().slice(0, 10);
  const out: WeeklyResult = { recipients: recipients.length, sent: 0, failed: 0, errors: [] };
  for (const to of recipients) {
    // One recipient's failure (even a network error) doesn't stop the others.
    const r = await sendViaResend(cfg, {
      to,
      subject: opts.test ? `[Test] ${mail.subject}` : mail.subject,
      html: mail.html,
      text: mail.text,
      tags: { category: opts.test ? "weekly-summary-test" : "weekly-summary" },
      idempotencyKey: opts.test ? `weekly-summary-test/${shortHash(to)}/${Date.now()}` : `weekly-summary/${day}/${shortHash(to)}`,
    }).catch((e: unknown) => ({ ok: false, error: e instanceof Error ? e.message : String(e) }));
    if (r.ok) out.sent += 1;
    else {
      out.failed += 1;
      if (r.error) out.errors.push(r.error.slice(0, 300));
    }
  }
  return out;
}
