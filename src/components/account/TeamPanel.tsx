"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Crown, Loader2, LogOut, Mail, Pencil, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { cx } from "@/lib/cx";
import type { Locale } from "@/lib/i18n";
import { TEAM_ROLE_LABEL, TEAM_STATUS_LABEL, inviteUrl, type MyTeam, type TeamInvite, type TeamMember } from "@/lib/team";

const FALLBACK_ORIGIN = "https://prompter.monster";

const COPY = {
  tr: {
    title: "Takım",
    intro: "Ekibinle birlikte kullan: takımdaki herkes Monster Pro özelliklerini alır; koltuklar ve davetler tek yerden yönetilir.",
    namePh: "Takım adı (örn. Acme Ürün Ekibi)",
    create: "Takım oluştur",
    createNote: (mail: string) => `Takımı kurunca üyelerini hemen davet edebilirsin; Pro özellikleri takım aktifleşince açılır. Aktivasyon ve fiyat için: ${mail}`,
    members: (n: number) => `${n} üye`,
    pendingInv: (n: number) => `${n} bekleyen davet`,
    seats: (n: number) => `${n} koltuk`,
    pending: "Takımın aktivasyon bekliyor. Üyelerini şimdiden davet edebilirsin; takım aktifleşince herkes Monster Pro özelliklerini alır.",
    pendingCta: "Aktivasyon için yaz",
    active: "Takım aktif — tüm üyeler Monster Pro.",
    library: "Takım kütüphanesi →",
    libraryHint: "Projelerini takımla paylaş, üyelerin paylaştıklarının kopyasını aç.",
    canceled: "Bu takım iptal edildi; üyeler kendi planlarına döndü.",
    you: "sen",
    monthCredits: (n: number) => `bu ay ${n} kredi`,
    makeAdmin: "Yönetici yap",
    makeMember: "Üye yap",
    transfer: "Sahipliği devret",
    remove: "Çıkar",
    inviteTitle: "Üye davet et",
    emailPh: "E-posta (isteğe bağlı)",
    roleMember: "Üye",
    roleAdmin: "Yönetici",
    makeLink: "Davet linki oluştur",
    linkReady: "Davet linki hazır (14 gün geçerli, tek kullanımlık):",
    copy: "Kopyala",
    copied: "Kopyalandı",
    sendMail: "E-postayla gönder",
    pendingTitle: "Bekleyen davetler",
    noEmail: "e-postasız link",
    expires: (d: string) => `son gün ${d}`,
    revoke: "İptal et",
    leave: "Takımdan ayrıl",
    del: "Takımı sil",
    activeDelete: (mail: string) => `Aktif takımı iptal etmek için ${mail} adresine yaz.`,
    rename: "Adı değiştir",
    save: "Kaydet",
    cancel: "Vazgeç",
    confirmLeave: "Takımdan ayrılmak istediğine emin misin? Takım üzerinden gelen Pro özelliklerin kapanır.",
    confirmDelete: "Takımı silmek istediğine emin misin? Tüm üyelikler ve davetler silinir.",
    confirmRemove: (u: string) => `${u} takımdan çıkarılsın mı?`,
    confirmTransfer: (u: string) => `Takımın sahipliği ${u} kullanıcısına devredilsin mi? Sen yönetici olarak kalırsın.`,
    mailSubject: (team: string) => `${team} takımına davet — Prompter.Monster`,
    mailBody: (team: string, link: string) =>
      `Merhaba,\n\nSeni Prompter.Monster'daki "${team}" takımına davet ediyorum. Bu linkten katılabilirsin (14 gün geçerli):\n${link}\n`,
    activationSubject: (team: string) => `Takım aktivasyonu: ${team}`,
    activationBody: (team: string, seats: number, id: string) =>
      `Merhaba,\n\n"${team}" takımını aktifleştirmek istiyorum (şu an ${seats} koltuk).\nTakım kimliği: ${id}\n`,
  },
  en: {
    title: "Team",
    intro: "Use it with your team: everyone in the team gets Monster Pro features; seats and invites are managed in one place.",
    namePh: "Team name (e.g. Acme Product Team)",
    create: "Create team",
    createNote: (mail: string) => `Once the team exists you can invite members right away; Pro features switch on when the team is activated. Activation and pricing: ${mail}`,
    members: (n: number) => `${n} ${n === 1 ? "member" : "members"}`,
    pendingInv: (n: number) => `${n} pending ${n === 1 ? "invite" : "invites"}`,
    seats: (n: number) => `${n} ${n === 1 ? "seat" : "seats"}`,
    pending: "Your team is awaiting activation. You can invite members now; everyone gets Monster Pro features once the team is active.",
    pendingCta: "Email us to activate",
    active: "Team active — every member is on Monster Pro.",
    library: "Team library →",
    libraryHint: "Share your projects with the team and open copies of what teammates shared.",
    canceled: "This team was canceled; members are back on their own plans.",
    you: "you",
    monthCredits: (n: number) => `${n} credits this month`,
    makeAdmin: "Make admin",
    makeMember: "Make member",
    transfer: "Transfer ownership",
    remove: "Remove",
    inviteTitle: "Invite a member",
    emailPh: "Email (optional)",
    roleMember: "Member",
    roleAdmin: "Admin",
    makeLink: "Create invite link",
    linkReady: "Invite link ready (valid for 14 days, single use):",
    copy: "Copy",
    copied: "Copied",
    sendMail: "Send by email",
    pendingTitle: "Pending invites",
    noEmail: "link without email",
    expires: (d: string) => `expires ${d}`,
    revoke: "Revoke",
    leave: "Leave team",
    del: "Delete team",
    activeDelete: (mail: string) => `To cancel an active team, email ${mail}.`,
    rename: "Rename",
    save: "Save",
    cancel: "Cancel",
    confirmLeave: "Leave the team? Pro features that come from the team will switch off.",
    confirmDelete: "Delete the team? All memberships and invites are removed.",
    confirmRemove: (u: string) => `Remove ${u} from the team?`,
    confirmTransfer: (u: string) => `Transfer team ownership to ${u}? You stay on as an admin.`,
    mailSubject: (team: string) => `Join ${team} on Prompter.Monster`,
    mailBody: (team: string, link: string) =>
      `Hi,\n\nI'm inviting you to the "${team}" team on Prompter.Monster. Join with this link (valid for 14 days):\n${link}\n`,
    activationSubject: (team: string) => `Team activation: ${team}`,
    activationBody: (team: string, seats: number, id: string) =>
      `Hi,\n\nI'd like to activate the "${team}" team (currently ${seats} seats).\nTeam id: ${id}\n`,
  },
} as const;

type Busy = string | null;

export function TeamPanel({
  locale,
  team,
  members,
  invites,
  contactEmail,
}: {
  locale: Locale;
  team: MyTeam | null;
  members: TeamMember[];
  invites: TeamInvite[];
  contactEmail: string;
}) {
  const c = COPY[locale];
  const router = useRouter();
  const [origin, setOrigin] = useState(FALLBACK_ORIGIN);
  const [busy, setBusy] = useState<Busy>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(team?.name ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [fresh, setFresh] = useState<{ link: string; email: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const fmt = (d: string) => new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { day: "numeric", month: "short" });
  const label = (m: TeamMember) => (m.username ? `@${m.username}` : (m.email ?? "—"));

  async function call(key: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    setBusy(key);
    setErr(null);
    try {
      const r = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify(body),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : `HTTP ${r.status}`);
      return j;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function act(key: string, body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    const j = await call(key, body);
    if (j) router.refresh();
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800);
    } catch {
      /* clipboard unavailable — the link stays selectable in the input */
    }
  }

  const mailto = (to: string, subject: string, body: string) =>
    `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const btn = "h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[12px] font-semibold text-zinc-300 hover:text-white hover:border-ink-400 inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50";
  const input = "h-9 min-w-0 rounded-lg bg-ink-950 border border-ink-600 px-2.5 text-[12.5px] text-zinc-200 placeholder:text-zinc-600";
  const spin = (key: string) => (busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null);

  return (
    <section id="team" className="rounded-2xl bg-ink-800 border border-ink-600 p-5 scroll-mt-20">
      <h2 className="text-[11px] tracking-widest text-zinc-500 font-semibold mb-1 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" aria-hidden /> {c.title.toUpperCase()}
      </h2>

      {!team ? (
        <>
          <p className="text-[12.5px] text-zinc-400 mb-3 max-w-[600px]">{c.intro}</p>
          <form
            className="flex flex-col sm:flex-row gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              void act("create", { action: "create", name });
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={c.namePh} className={cx(input, "flex-1")} aria-label={c.namePh} />
            <button type="submit" disabled={busy !== null || name.trim().length < 2} className="h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
              {spin("create")} {c.create}
            </button>
          </form>
          <p className="mt-2 text-[11.5px] text-zinc-500">{c.createNote(contactEmail)}</p>
        </>
      ) : (
        renderTeam()
      )}

      {err && <p className="mt-3 text-[12px] text-red-400" role="alert">{err}</p>}
    </section>
  );

  // Rendered inline (called, not mounted as <Component />) so inputs keep focus across re-renders.
  function renderTeam() {
    if (!team) return null;
    const canManage = team.my_role === "owner" || team.my_role === "admin";
    const isOwner = team.my_role === "owner";
    const statusTone = team.status === "active" ? "text-lime border-lime/30 bg-lime/10" : team.status === "pending" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-red-300 border-red-500/30 bg-red-500/10";

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {renaming ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault();
                const j = await call("rename", { action: "rename", name: newName });
                if (j) {
                  setRenaming(false);
                  router.refresh();
                }
              }}
            >
              <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} className={cx(input, "w-[220px]")} aria-label={c.rename} autoFocus />
              <button type="submit" disabled={busy !== null} className={btn}>
                {spin("rename")} {c.save}
              </button>
              <button type="button" onClick={() => setRenaming(false)} className={btn}>
                {c.cancel}
              </button>
            </form>
          ) : (
            <>
              <span className="text-[16px] font-bold">{team.name}</span>
              {canManage && (
                <button type="button" onClick={() => { setNewName(team.name); setRenaming(true); }} className="text-zinc-500 hover:text-white" aria-label={c.rename} title={c.rename}>
                  <Pencil className="w-3.5 h-3.5" aria-hidden />
                </button>
              )}
            </>
          )}
          <span className={cx("inline-flex items-center px-2 h-6 rounded-full border text-[11px] font-medium", statusTone)}>{TEAM_STATUS_LABEL[team.status][locale]}</span>
          <span className="text-[12px] text-zinc-500">
            {c.members(team.member_count)} · {c.pendingInv(team.pending_invites)} · {c.seats(team.seats)}
          </span>
        </div>

        {team.status === "pending" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[12.5px] text-amber-200 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex-1">{c.pending}</span>
            {isOwner && (
              <a href={mailto(contactEmail, c.activationSubject(team.name), c.activationBody(team.name, team.seats, team.team_id))} className="h-8 px-3 rounded-lg bg-amber-400 text-black text-[12px] font-bold inline-flex items-center gap-1.5 shrink-0 self-start">
                <Mail className="w-3.5 h-3.5" aria-hidden /> {c.pendingCta}
              </a>
            )}
          </div>
        )}
        {team.status === "active" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[12.5px] text-lime">{c.active}</p>
            <a href={`${locale === "en" ? "/en" : ""}/library#team-library`} className="text-[12.5px] font-semibold text-zinc-200 hover:text-white underline underline-offset-2" title={c.libraryHint}>
              {c.library}
            </a>
          </div>
        )}
        {team.status === "canceled" && <p className="text-[12.5px] text-red-300">{c.canceled}</p>}

        <ul className="divide-y divide-ink-600 rounded-xl border border-ink-600 bg-ink-950">
          {members.map((m) => (
            <li key={m.user_id} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-[12.5px]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-lime shrink-0" aria-hidden />}
                  {m.username ? (
                    <a href={`${locale === "en" ? "/en" : ""}/u/${m.username}`} className="font-semibold truncate hover:underline">
                      {label(m)}
                    </a>
                  ) : (
                    <span className="font-semibold truncate">{label(m)}</span>
                  )}
                  {m.is_me && <span className="text-zinc-500">({c.you})</span>}
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-ink-800 border border-ink-600 text-zinc-400">{TEAM_ROLE_LABEL[m.role][locale]}</span>
                </div>
                <div className="text-[11.5px] text-zinc-500 truncate">
                  {[m.email, m.month_credits != null ? c.monthCredits(m.month_credits) : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              {!m.is_me && canManage && m.role !== "owner" && (isOwner || m.role === "member") && (
                <div className="flex flex-wrap gap-1.5">
                  {isOwner && (
                    <button type="button" disabled={busy !== null} className={btn} onClick={() => act(`role:${m.user_id}`, { action: "role", userId: m.user_id, role: m.role === "admin" ? "member" : "admin" })}>
                      {spin(`role:${m.user_id}`)} {m.role === "admin" ? c.makeMember : c.makeAdmin}
                    </button>
                  )}
                  {isOwner && (
                    <button type="button" disabled={busy !== null} className={btn} onClick={() => act(`transfer:${m.user_id}`, { action: "transfer", userId: m.user_id }, c.confirmTransfer(label(m)))}>
                      {spin(`transfer:${m.user_id}`)} <Crown className="w-3.5 h-3.5" aria-hidden /> {c.transfer}
                    </button>
                  )}
                  <button type="button" disabled={busy !== null} className={cx(btn, "text-red-300 hover:text-red-200")} onClick={() => act(`remove:${m.user_id}`, { action: "remove", userId: m.user_id }, c.confirmRemove(label(m)))}>
                    {spin(`remove:${m.user_id}`)} <UserMinus className="w-3.5 h-3.5" aria-hidden /> {c.remove}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {canManage && team.status !== "canceled" && (
          <div className="rounded-xl border border-ink-600 bg-ink-950 p-3 space-y-2.5">
            <div className="text-[11px] tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" aria-hidden /> {c.inviteTitle.toUpperCase()}
            </div>
            <form
              className="flex flex-col sm:flex-row gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault();
                const j = await call("invite", { action: "invite", email: email.trim() || undefined, role });
                const inv = j?.invite as { token?: string } | undefined;
                if (inv?.token) {
                  setFresh({ link: inviteUrl(origin, inv.token, locale), email: email.trim() });
                  setEmail("");
                  router.refresh();
                }
              }}
            >
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder={c.emailPh} className={cx(input, "flex-1")} aria-label={c.emailPh} />
              {isOwner && (
                <select value={role} onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "member")} className={cx(input, "pr-7")} aria-label={c.roleMember}>
                  <option value="member">{c.roleMember}</option>
                  <option value="admin">{c.roleAdmin}</option>
                </select>
              )}
              <button type="submit" disabled={busy !== null} className="h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
                {spin("invite")} {c.makeLink}
              </button>
            </form>

            {fresh && (
              <div className="rounded-lg border border-lime/30 bg-lime/5 p-2.5 space-y-1.5">
                <div className="text-[11.5px] text-lime">{c.linkReady}</div>
                <div className="flex flex-col sm:flex-row gap-1.5">
                  <input readOnly value={fresh.link} onFocus={(e) => e.currentTarget.select()} className={cx(input, "flex-1")} aria-label={c.linkReady} />
                  <button type="button" onClick={() => copy(fresh.link, "fresh")} className={btn}>
                    {copied === "fresh" ? <Check className="w-3.5 h-3.5 text-lime" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                    {copied === "fresh" ? c.copied : c.copy}
                  </button>
                  <a href={mailto(fresh.email, c.mailSubject(team.name), c.mailBody(team.name, fresh.link))} className={btn}>
                    <Mail className="w-3.5 h-3.5" aria-hidden /> {c.sendMail}
                  </a>
                </div>
              </div>
            )}

            {invites.length > 0 && (
              <div>
                <div className="text-[11px] text-zinc-500 mb-1">{c.pendingTitle}</div>
                <ul className="space-y-1">
                  {invites.map((i) => {
                    const link = inviteUrl(origin, i.token, locale);
                    return (
                      <li key={i.invite_id} className="flex flex-wrap items-center gap-1.5 text-[12px]">
                        <span className="min-w-0 flex-1 truncate text-zinc-300">
                          {i.email ?? <span className="text-zinc-500">{c.noEmail}</span>}{" "}
                          <span className="text-zinc-500">
                            · {TEAM_ROLE_LABEL[i.role][locale]} · {c.expires(fmt(i.expires_at))}
                          </span>
                        </span>
                        <button type="button" onClick={() => copy(link, i.invite_id)} className={btn}>
                          {copied === i.invite_id ? <Check className="w-3.5 h-3.5 text-lime" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                          {copied === i.invite_id ? c.copied : c.copy}
                        </button>
                        <button type="button" disabled={busy !== null} onClick={() => act(`revoke:${i.invite_id}`, { action: "revoke", inviteId: i.invite_id })} className={cx(btn, "text-red-300 hover:text-red-200")}>
                          {spin(`revoke:${i.invite_id}`)} {c.revoke}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!isOwner && (
            <button type="button" disabled={busy !== null} onClick={() => act("leave", { action: "leave" }, c.confirmLeave)} className={btn}>
              {spin("leave")} <LogOut className="w-3.5 h-3.5" aria-hidden /> {c.leave}
            </button>
          )}
          {isOwner && team.status !== "active" && (
            <button type="button" disabled={busy !== null} onClick={() => act("delete", { action: "delete" }, c.confirmDelete)} className={cx(btn, "text-red-300 hover:text-red-200")}>
              {spin("delete")} <Trash2 className="w-3.5 h-3.5" aria-hidden /> {c.del}
            </button>
          )}
          {isOwner && team.status === "active" && <span className="text-[11.5px] text-zinc-500">{c.activeDelete(contactEmail)}</span>}
        </div>
      </div>
    );
  }
}
