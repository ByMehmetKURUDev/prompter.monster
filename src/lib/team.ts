/**
 * Team plan (migration 0017_teams.sql) — shared types and error messages for the account panel,
 * the /join/<token> page, the /api/team route and the admin page. No server/client-only APIs here.
 *
 * Model: one user can be in one team. A team starts as "pending"; when it is "active" every member's
 * effective plan is Pro (the database decides: effective_plan()). Billing for teams is deferred to the
 * Lemon Squeezy activation — until then an admin activates a team (Admin → Takımlar).
 */
import type { Locale } from "./i18n";

export type TeamStatus = "pending" | "active" | "canceled";
export type TeamRole = "owner" | "admin" | "member";

export interface MyTeam {
  team_id: string;
  name: string;
  status: TeamStatus;
  seats: number;
  my_role: TeamRole;
  member_count: number;
  pending_invites: number;
  owner_username: string | null;
  created_at: string;
  activated_at: string | null;
}

export interface TeamMember {
  user_id: string;
  username: string | null;
  /** Only filled for the team owner / admins. */
  email: string | null;
  role: TeamRole;
  joined_at: string;
  /** Plan credits used this month — only for the team owner / admins. */
  month_credits: number | null;
  is_me: boolean;
}

export interface TeamInvite {
  invite_id: string;
  token: string;
  email: string | null;
  role: "admin" | "member";
  created_at: string;
  expires_at: string;
}

export interface InvitePreview {
  team_name: string;
  inviter_username: string | null;
  team_status: TeamStatus;
  state: "valid" | "revoked" | "used" | "expired" | "canceled";
}

/** Error codes raised by the team RPCs (see 0017_teams.sql) → user-facing text. */
const ERRORS: Record<string, { tr: string; en: string }> = {
  not_authenticated: { tr: "Önce giriş yap.", en: "Please sign in first." },
  banned: { tr: "Bu hesap takım işlemleri için kapalı.", en: "This account can't use team features." },
  invalid_name: { tr: "Takım adı 2–60 karakter olmalı.", en: "The team name must be 2–60 characters." },
  already_in_team: { tr: "Zaten bir takımdasın. Önce mevcut takımından ayrıl.", en: "You're already in a team. Leave it first." },
  already_member: { tr: "Zaten bu takımın üyesisin.", en: "You're already a member of this team." },
  no_team: { tr: "Bir takımda değilsin.", en: "You're not in a team." },
  forbidden: { tr: "Bu işlem için yetkin yok.", en: "You don't have permission to do that." },
  team_active: {
    tr: "Aktif (ücretli) takım buradan silinemez — iptal için bize yaz.",
    en: "An active (paid) team can't be deleted here — email us to cancel.",
  },
  team_canceled: { tr: "Bu takım iptal edilmiş.", en: "This team has been canceled." },
  invalid_role: { tr: "Geçersiz rol.", en: "Invalid role." },
  invalid_email: { tr: "Geçerli bir e-posta yaz (ya da boş bırak).", en: "Enter a valid email (or leave it empty)." },
  seats_full: {
    tr: "Koltuklar dolu (üyeler + bekleyen davetler). Bir daveti iptal et ya da koltuk ekletmek için bize yaz.",
    en: "All seats are taken (members + pending invites). Revoke an invite or email us to add seats.",
  },
  invite_not_found: { tr: "Davet bulunamadı.", en: "Invite not found." },
  invalid_invite: { tr: "Bu davet linki geçersiz.", en: "This invite link isn't valid." },
  invite_revoked: { tr: "Bu davet iptal edilmiş.", en: "This invite has been revoked." },
  invite_used: { tr: "Bu davet zaten kullanılmış.", en: "This invite has already been used." },
  invite_expired: { tr: "Bu davetin süresi dolmuş — yeni bir link iste.", en: "This invite has expired — ask for a new link." },
  owner_cannot_leave: {
    tr: "Takım sahibi ayrılamaz: önce sahipliği bir üyeye devret ya da takımı sil.",
    en: "The owner can't leave: transfer ownership to a member or delete the team first.",
  },
  use_leave: { tr: "Kendini çıkarmak için 'Takımdan ayrıl'ı kullan.", en: "Use 'Leave team' to remove yourself." },
  not_member: { tr: "Bu kişi takımda değil.", en: "That person isn't in the team." },
  not_ready: {
    tr: "Takım özelliği henüz etkin değil (veritabanı güncellemesi bekleniyor).",
    en: "Teams aren't enabled yet (a database update is pending).",
  },
};

export const TEAM_ERROR_CODES = Object.keys(ERRORS);

export function teamErrorMessage(code: string | null | undefined, locale: Locale): string {
  const hit = code ? ERRORS[code] : undefined;
  if (hit) return hit[locale];
  return locale === "en" ? "Something went wrong, please try again." : "Bir şeyler ters gitti, tekrar dene.";
}

/** Maps a Postgres/PostgREST error from a team RPC to one of the codes above (or null). */
export function teamErrorCode(err: { message?: string | null; code?: string | null } | null | undefined): string | null {
  if (!err) return null;
  const msg = String(err.message ?? "").trim();
  if (/function .* does not exist|could not find the function/i.test(msg)) return "not_ready";
  return TEAM_ERROR_CODES.includes(msg) ? msg : null;
}

/** Shareable invite URL (the join page exists in both languages). */
export function inviteUrl(origin: string, token: string, locale: Locale): string {
  return `${origin.replace(/\/$/, "")}${locale === "en" ? "/en" : ""}/join/${token}`;
}

export const TEAM_ROLE_LABEL: Record<TeamRole, { tr: string; en: string }> = {
  owner: { tr: "Sahip", en: "Owner" },
  admin: { tr: "Yönetici", en: "Admin" },
  member: { tr: "Üye", en: "Member" },
};

export const TEAM_STATUS_LABEL: Record<TeamStatus, { tr: string; en: string }> = {
  pending: { tr: "Aktivasyon bekliyor", en: "Awaiting activation" },
  active: { tr: "Aktif", en: "Active" },
  canceled: { tr: "İptal edildi", en: "Canceled" },
};
