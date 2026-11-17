-- 0017 — Takım planı (ödeme bağımsız iskelet) + "Arkadaşını getir" bonus kredisinin düzeltilmesi.
-- Supabase SQL Editor'da çalıştırılabilir (0001–0016 uygulanmış olmalı). Tekrar çalıştırılabilir (idempotent).
-- DROP yok: yeni tablolar/kolonlar/indeksler + CREATE OR REPLACE (aynı imzalar) + yeni RPC'ler.
--
-- A) Takım planı: bir kullanıcı takım kurar (durum 'pending'), davet linkleriyle üye ekler. Takım 'active' olunca
--    her üyenin ETKİN planı Pro olur. Studio, kredi kotası, API ve MCP etkin planı aynı yerden okur: effective_plan().
--    Kişisel abonelik (profiles.plan) ve Lemon Squeezy webhook'u hiç değişmez. Koltuk bazlı ödeme LS aktivasyonuna
--    bırakıldı; o zamana kadar takımı admin aktifleştirir (Admin → Takımlar — örn. faturalı/kurumsal satış).
--    Bir kullanıcı aynı anda tek takımda olabilir. Bekleyen davetler koltuk ayırır (üye + bekleyen davet ≤ koltuk).
--    Tablolara istemciden doğrudan erişim yok (RLS açık, yalnız admin okuma politikası); her işlem aşağıdaki
--    security definer RPC'lerden, kendi yetki kontrolüyle geçer.
-- B) #68 düzeltmesi: 0016'da bonus kredi günlük/aylık LİMİTE kalıcı ekleniyordu (Free kullanıcı için her gün +5 —
--    arayüzdeki "+5 bonus kredi" ifadesiyle uyuşmuyor ve maliyeti sınırsızdı). Artık bonus, normal kota bitince
--    harcanan bir BAKİYE: ai_usage.bonus_credits satırın bonusla ödenen kısmını tutar; başarısız çağrıda bakiye
--    trigger ile iade edilir. Davet eden için ödül sayısına tavan (referral_max_rewards, varsayılan 25).
--    Ayrıca 0016 yalnız web yolunu (consume_ai_call) güncellemişti, API/MCP yolu (consume_ai_credits) eski kalmıştı:
--    mantık yeniden tek çekirdekte (consume_ai_credits), consume_ai_call yine onu çağıran ince sarmalayıcı (0008 deseni).
--    Uygulandığı anda canlıda hiç referral/bonus kaydı yoktu (0 satır) — veri dönüşümü gerekmedi.

-- 1) ai_usage: satırın bonus bakiyesinden ödenen kısmı ------------------------------------------------
alter table public.ai_usage add column if not exists bonus_credits integer not null default 0;

-- 2) Takım tabloları -----------------------------------------------------------------------------------
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 2 and 60),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'active', 'canceled')),
  seats        integer not null default 5 check (seats between 1 and 1000),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  activated_at timestamptz
);
create index if not exists teams_owner_idx on public.teams (owner_id);
create index if not exists teams_status_idx on public.teams (status);

create table if not exists public.team_members (
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (user_id)
);

create table if not exists public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  token       text not null unique,
  email       text check (email is null or char_length(email) <= 254),
  role        text not null default 'member' check (role in ('admin', 'member')),
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days'),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at  timestamptz
);
create index if not exists team_invites_team_idx on public.team_invites (team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'teams' and policyname = 'admin read teams') then
    create policy "admin read teams" on public.teams for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'admin read team members') then
    create policy "admin read team members" on public.team_members for select using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_invites' and policyname = 'admin read team invites') then
    create policy "admin read team invites" on public.team_invites for select using (public.is_admin());
  end if;
end $$;

-- 3) Etkin plan: kişisel Pro VEYA aktif bir takımın üyesi → 'pro' ----------------------------------------
create or replace function public.effective_plan(p_uid uuid)
returns text
language sql stable security definer set search_path = public as $$
  select case
           when p.plan = 'pro' then 'pro'
           when exists (select 1 from public.team_members m join public.teams t on t.id = m.team_id
                        where m.user_id = p.id and t.status = 'active') then 'pro'
           else 'free'
         end
  from public.profiles p where p.id = p_uid;
$$;
revoke all on function public.effective_plan(uuid) from public;
revoke all on function public.effective_plan(uuid) from anon, authenticated;

-- 4) Kredi çekirdeği: etkin plan + bonus bakiyesi + referral ödülü (web, API ve MCP aynı yol) ---------------
create or replace function public.consume_ai_credits(p_uid uuid, p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language plpgsql security definer set search_path = public as $$
declare
  v_plan text; v_banned timestamptz;
  v_cost int := greatest(1, least(coalesce(p_credits, 1), 100));
  v_day_limit int; v_month_limit int; v_used int := 0; v_used_month int := 0; v_id bigint;
  v_bonus int := 0; v_left int; v_from_regular int; v_from_bonus int;
  v_referred_by uuid; v_bonus_granted boolean; v_reward int;
begin
  if p_uid is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;

  -- Aynı kullanıcının eşzamanlı istekleri sırayla işlenir (kota ve bonus bakiyesi yarışını önler).
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 7));

  select p.banned_at, coalesce(p.bonus_ai_credits, 0), p.referred_by, coalesce(p.referral_bonus_granted, false)
    into v_banned, v_bonus, v_referred_by, v_bonus_granted
    from public.profiles p where p.id = p_uid;
  if not found then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  if v_banned is not null then
    return query select false, 0, 'banned'::text, null::bigint, 0, 0, 0; return;
  end if;
  if not public.setting_bool('ai_enabled', true) then
    return query select false, 0, 'disabled'::text, null::bigint, 0, 0, 0; return;
  end if;

  v_plan := coalesce(public.effective_plan(p_uid), 'free');
  v_day_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_day', 150) else public.setting_int('free_credits_per_day', 5) end;
  v_month_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) else 0 end;

  -- Kota yalnız kotadan ödenen kısmı sayar (bonus bakiyesiyle ödenen kısım hariç).
  select coalesce(sum(u.credits - u.bonus_credits), 0)::int into v_used from public.ai_usage u
    where u.owner_id = p_uid and u.status <> 'failed' and u.created_at >= date_trunc('day', now());
  if v_plan = 'pro' then
    select coalesce(sum(u.credits - u.bonus_credits), 0)::int into v_used_month from public.ai_usage u
      where u.owner_id = p_uid and u.status <> 'failed' and u.created_at >= date_trunc('month', now());
  end if;

  v_left := greatest(v_day_limit - v_used, 0);
  if v_plan = 'pro' then
    v_left := least(v_left, greatest(v_month_limit - v_used_month, 0));
  end if;
  v_from_regular := least(v_cost, v_left);
  v_from_bonus := v_cost - v_from_regular;

  if v_from_bonus > v_bonus then
    return query select false, v_left, v_plan, null::bigint, v_day_limit, v_used_month, v_month_limit; return;
  end if;

  insert into public.ai_usage (owner_id, endpoint, credits, bonus_credits, plan, status, source)
    values (p_uid, left(coalesce(p_endpoint, 'ai'), 40), v_cost, v_from_bonus, v_plan, 'pending', left(coalesce(p_source, 'web'), 20))
    returning id into v_id;

  if v_from_bonus > 0 then
    update public.profiles set bonus_ai_credits = greatest(coalesce(bonus_ai_credits, 0) - v_from_bonus, 0) where id = p_uid;
  end if;

  -- Arkadaşını getir: davet edilenin ilk AI eylemi → iki tarafa tek seferlik bonus bakiyesi.
  if v_referred_by is not null and not v_bonus_granted then
    v_reward := greatest(0, least(public.setting_int('referral_bonus_credits', 5), 1000));
    update public.profiles set bonus_ai_credits = coalesce(bonus_ai_credits, 0) + v_reward, referral_bonus_granted = true where id = p_uid;
    if v_reward > 0 and (select count(*) from public.profiles r
                          where r.referred_by = v_referred_by and r.referral_bonus_granted and r.id <> p_uid)
                        < public.setting_int('referral_max_rewards', 25) then
      update public.profiles set bonus_ai_credits = coalesce(bonus_ai_credits, 0) + v_reward where id = v_referred_by;
    end if;
  end if;

  return query select true, v_left - v_from_regular, v_plan, v_id, v_day_limit,
    case when v_plan = 'pro' then v_used_month + v_from_regular else 0 end, v_month_limit;
end $$;
revoke all on function public.consume_ai_credits(uuid, text, integer, text) from public;
revoke all on function public.consume_ai_credits(uuid, text, integer, text) from anon, authenticated;
grant execute on function public.consume_ai_credits(uuid, text, integer, text) to service_role;

-- Oturumlu kullanıcı yolu yine aynı çekirdeği kullanır (0008 deseni; 0016'daki ayrı kopya kaldırıldı).
create or replace function public.consume_ai_call(p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language sql security definer set search_path = public as $$
  select * from public.consume_ai_credits(auth.uid(), p_endpoint, p_credits, p_source);
$$;
revoke all on function public.consume_ai_call(text, integer, text) from public;
grant execute on function public.consume_ai_call(text, integer, text) to authenticated;

-- Başarısız çağrı: bonusla ödenen kısım bakiyeye geri döner (kota kısmı zaten 'failed' satırları saymıyor).
create or replace function public.ai_usage_bonus_refund()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'failed' and coalesce(old.status, '') <> 'failed' and coalesce(old.bonus_credits, 0) > 0 and new.owner_id is not null then
    update public.profiles set bonus_ai_credits = coalesce(bonus_ai_credits, 0) + old.bonus_credits where id = new.owner_id;
    new.bonus_credits := 0;
  end if;
  return new;
end $$;
revoke all on function public.ai_usage_bonus_refund() from public;
revoke all on function public.ai_usage_bonus_refund() from anon, authenticated;
create or replace trigger ai_usage_bonus_refund
  before update of status on public.ai_usage
  for each row execute function public.ai_usage_bonus_refund();

-- 5) Kullanım göstergesi (Studio + Hesabım): etkin plan, yalnız kota kısmı ---------------------------------
create or replace function public.ai_usage_today()
returns table (used integer, "limit" integer, plan text, month_used integer, month_limit integer)
language sql stable security definer set search_path = public as $$
  with e as (select public.effective_plan(auth.uid()) as plan)
  select
    (select coalesce(sum(u.credits - u.bonus_credits), 0)::int from public.ai_usage u
      where u.owner_id = auth.uid() and u.status <> 'failed' and u.created_at >= date_trunc('day', now())) as used,
    (case when e.plan = 'pro' then public.setting_int('pro_credits_per_day', 150) else public.setting_int('free_credits_per_day', 5) end) as "limit",
    e.plan,
    (select coalesce(sum(u.credits - u.bonus_credits), 0)::int from public.ai_usage u
      where u.owner_id = auth.uid() and u.status <> 'failed' and u.created_at >= date_trunc('month', now())) as month_used,
    (case when e.plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) else 0 end) as month_limit
  from e where e.plan is not null;
$$;
revoke all on function public.ai_usage_today() from public;
grant execute on function public.ai_usage_today() to authenticated;

-- 6) API anahtarı → sahip: etkin plan (takım üyesinin anahtarı da Pro) ------------------------------------
create or replace function public.resolve_api_key(p_hash text)
returns table (key_id uuid, owner_id uuid, plan text, banned boolean)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_owner uuid;
begin
  update public.api_keys k set calls = k.calls + 1, last_used_at = now()
    where k.key_hash = p_hash and k.revoked_at is null
    returning k.id, k.owner_id into v_id, v_owner;
  if v_id is null then return; end if;
  return query select v_id, v_owner, public.effective_plan(v_owner), (p.banned_at is not null) from public.profiles p where p.id = v_owner;
end $$;
revoke all on function public.resolve_api_key(text) from public;
revoke all on function public.resolve_api_key(text) from anon, authenticated;
grant execute on function public.resolve_api_key(text) to service_role;

-- 7) Takım — okuma RPC'leri ------------------------------------------------------------------------------
create or replace function public.my_team()
returns table (team_id uuid, name text, status text, seats integer, my_role text, member_count integer, pending_invites integer,
               owner_username text, created_at timestamptz, activated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.status, t.seats, m.role,
         (select count(*)::int from public.team_members x where x.team_id = t.id),
         (select count(*)::int from public.team_invites i
           where i.team_id = t.id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()),
         (select o.username from public.profiles o where o.id = t.owner_id),
         t.created_at, t.activated_at
  from public.team_members m
  join public.teams t on t.id = m.team_id
  where m.user_id = auth.uid();
$$;
revoke all on function public.my_team() from public;
grant execute on function public.my_team() to authenticated;

-- E-posta ve aylık kredi yalnız sahip/yönetici görür; üyeler birbirinin kullanıcı adını görür.
create or replace function public.my_team_members()
returns table (user_id uuid, username text, email text, role text, joined_at timestamptz, month_credits integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  with me as (select m.team_id, m.role from public.team_members m where m.user_id = auth.uid())
  select x.user_id, p.username,
         case when me.role in ('owner', 'admin') then p.email else null end,
         x.role, x.joined_at,
         case when me.role in ('owner', 'admin') then
           (select coalesce(sum(u.credits - u.bonus_credits), 0)::int from public.ai_usage u
             where u.owner_id = x.user_id and u.status <> 'failed' and u.created_at >= date_trunc('month', now()))
         end,
         x.user_id = auth.uid()
  from me
  join public.team_members x on x.team_id = me.team_id
  join public.profiles p on p.id = x.user_id
  order by case x.role when 'owner' then 0 when 'admin' then 1 else 2 end, x.joined_at;
$$;
revoke all on function public.my_team_members() from public;
grant execute on function public.my_team_members() to authenticated;

create or replace function public.my_team_invites()
returns table (invite_id uuid, token text, email text, role text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, i.token, i.email, i.role, i.created_at, i.expires_at
  from public.team_members m
  join public.team_invites i on i.team_id = m.team_id
  where m.user_id = auth.uid() and m.role in ('owner', 'admin')
    and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
  order by i.created_at desc;
$$;
revoke all on function public.my_team_invites() from public;
grant execute on function public.my_team_invites() to authenticated;

-- Davet sayfası (/join/<token>) için: giriş yapmamış ziyaretçi de görebilir. Token 244 bit rastgele.
create or replace function public.team_invite_preview(p_token text)
returns table (team_name text, inviter_username text, team_status text, state text)
language sql stable security definer set search_path = public as $$
  select t.name, ip.username, t.status,
         case
           when i.revoked_at is not null then 'revoked'
           when i.accepted_at is not null then 'used'
           when i.expires_at <= now() then 'expired'
           when t.status = 'canceled' then 'canceled'
           else 'valid'
         end
  from public.team_invites i
  join public.teams t on t.id = i.team_id
  left join public.profiles ip on ip.id = i.invited_by
  where char_length(coalesce(p_token, '')) between 20 and 100 and i.token = p_token;
$$;
revoke all on function public.team_invite_preview(text) from public;
grant execute on function public.team_invite_preview(text) to anon, authenticated;

-- 8) Takım — yazma RPC'leri (hata kodları uygulamada TR/EN mesaja çevrilir: src/lib/team.ts) ---------------
create or replace function public.create_team(p_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.banned_at is not null) then
    raise exception 'banned' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 11));
  if exists (select 1 from public.team_members m where m.user_id = v_uid) then
    raise exception 'already_in_team' using errcode = '23505';
  end if;
  insert into public.teams (name, owner_id, seats)
    values (v_name, v_uid, greatest(1, least(public.setting_int('team_default_seats', 5), 1000)))
    returning id into v_id;
  insert into public.team_members (team_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end $$;
revoke all on function public.create_team(text) from public;
grant execute on function public.create_team(text) to authenticated;

create or replace function public.rename_team(p_name text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_name text := btrim(coalesce(p_name, '')); v_team uuid; v_role text;
begin
  select m.team_id, m.role into v_team, v_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_role not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'invalid_name' using errcode = '22023'; end if;
  update public.teams set name = v_name, updated_at = now() where id = v_team;
end $$;
revoke all on function public.rename_team(text) from public;
grant execute on function public.rename_team(text) to authenticated;

-- Aktif (ücretli) takım kullanıcı tarafından silinemez: iptal destek/admin üzerinden (ileride LS iptali).
create or replace function public.delete_team()
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_role text; v_status text;
begin
  select m.team_id, m.role into v_team, v_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_role <> 'owner' then raise exception 'forbidden' using errcode = '42501'; end if;
  select t.status into v_status from public.teams t where t.id = v_team;
  if v_status = 'active' then raise exception 'team_active' using errcode = '55000'; end if;
  delete from public.teams where id = v_team;
end $$;
revoke all on function public.delete_team() from public;
grant execute on function public.delete_team() to authenticated;

create or replace function public.create_team_invite(p_email text default null, p_role text default 'member')
returns table (invite_id uuid, invite_token text, invite_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_team uuid; v_my_role text; v_seats int; v_status text; v_taken int;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_role text := coalesce(nullif(btrim(coalesce(p_role, '')), ''), 'member');
  v_token text; v_inv_id uuid; v_exp timestamptz;
begin
  select m.team_id, m.role into v_team, v_my_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_my_role not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_role not in ('admin', 'member') then raise exception 'invalid_role' using errcode = '22023'; end if;
  if v_role = 'admin' and v_my_role <> 'owner' then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_team::text, 11));
  select t.seats, t.status into v_seats, v_status from public.teams t where t.id = v_team;
  if v_status = 'canceled' then raise exception 'team_canceled' using errcode = '55000'; end if;
  select (select count(*) from public.team_members x where x.team_id = v_team)
       + (select count(*) from public.team_invites i
           where i.team_id = v_team and i.accepted_at is null and i.revoked_at is null and i.expires_at > now())
    into v_taken;
  if v_taken >= v_seats then raise exception 'seats_full' using errcode = '53400'; end if;

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.team_invites (team_id, token, email, role, invited_by)
    values (v_team, v_token, v_email, v_role, v_uid)
    returning team_invites.id, team_invites.expires_at into v_inv_id, v_exp;
  return query select v_inv_id, v_token, v_exp;
end $$;
revoke all on function public.create_team_invite(text, text) from public;
grant execute on function public.create_team_invite(text, text) to authenticated;

create or replace function public.revoke_team_invite(p_invite uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_my_role text;
begin
  select m.team_id, m.role into v_team, v_my_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_my_role not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.team_invites i set revoked_at = now()
    where i.id = p_invite and i.team_id = v_team and i.accepted_at is null and i.revoked_at is null;
  if not found then raise exception 'invite_not_found' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.revoke_team_invite(uuid) from public;
grant execute on function public.revoke_team_invite(uuid) to authenticated;

create or replace function public.accept_team_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_inv_id uuid; v_team uuid; v_role text; v_exp timestamptz; v_acc timestamptz; v_rev timestamptz;
  v_seats int; v_status text; v_members int; v_current uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.banned_at is not null) then
    raise exception 'banned' using errcode = '42501';
  end if;
  select i.id, i.team_id, i.role, i.expires_at, i.accepted_at, i.revoked_at
    into v_inv_id, v_team, v_role, v_exp, v_acc, v_rev
    from public.team_invites i where i.token = btrim(coalesce(p_token, '')) for update;
  if v_inv_id is null then raise exception 'invalid_invite' using errcode = 'P0002'; end if;
  if v_rev is not null then raise exception 'invite_revoked' using errcode = '55000'; end if;
  if v_acc is not null then raise exception 'invite_used' using errcode = '55000'; end if;
  if v_exp <= now() then raise exception 'invite_expired' using errcode = '55000'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 11));
  select m.team_id into v_current from public.team_members m where m.user_id = v_uid;
  if v_current = v_team then raise exception 'already_member' using errcode = '23505'; end if;
  if v_current is not null then raise exception 'already_in_team' using errcode = '23505'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_team::text, 11));
  select t.seats, t.status into v_seats, v_status from public.teams t where t.id = v_team;
  if v_status = 'canceled' then raise exception 'team_canceled' using errcode = '55000'; end if;
  select count(*) into v_members from public.team_members x where x.team_id = v_team;
  if v_members >= v_seats then raise exception 'seats_full' using errcode = '53400'; end if;

  insert into public.team_members (team_id, user_id, role) values (v_team, v_uid, v_role);
  update public.team_invites set accepted_by = v_uid, accepted_at = now() where id = v_inv_id;
  return v_team;
end $$;
revoke all on function public.accept_team_invite(text) from public;
grant execute on function public.accept_team_invite(text) to authenticated;

create or replace function public.leave_team()
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_role text;
begin
  select m.team_id, m.role into v_team, v_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_role = 'owner' then raise exception 'owner_cannot_leave' using errcode = '55000'; end if;
  delete from public.team_members where team_id = v_team and user_id = v_uid;
end $$;
revoke all on function public.leave_team() from public;
grant execute on function public.leave_team() to authenticated;

-- Sahip herkesi (kendisi hariç), yönetici yalnız 'member' rolündekileri çıkarabilir.
create or replace function public.remove_team_member(p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_my_role text; v_target_role text;
begin
  select m.team_id, m.role into v_team, v_my_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_my_role not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user is null or p_user = v_uid then raise exception 'use_leave' using errcode = '22023'; end if;
  select x.role into v_target_role from public.team_members x where x.team_id = v_team and x.user_id = p_user;
  if v_target_role is null then raise exception 'not_member' using errcode = 'P0002'; end if;
  if v_target_role = 'owner' or (v_target_role = 'admin' and v_my_role <> 'owner') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.team_members where team_id = v_team and user_id = p_user;
end $$;
revoke all on function public.remove_team_member(uuid) from public;
grant execute on function public.remove_team_member(uuid) to authenticated;

create or replace function public.set_team_member_role(p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_my_role text; v_target_role text;
begin
  if coalesce(p_role, '') not in ('admin', 'member') then raise exception 'invalid_role' using errcode = '22023'; end if;
  select m.team_id, m.role into v_team, v_my_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_my_role <> 'owner' then raise exception 'forbidden' using errcode = '42501'; end if;
  select x.role into v_target_role from public.team_members x where x.team_id = v_team and x.user_id = p_user;
  if v_target_role is null then raise exception 'not_member' using errcode = 'P0002'; end if;
  if v_target_role = 'owner' then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.team_members set role = p_role where team_id = v_team and user_id = p_user;
end $$;
revoke all on function public.set_team_member_role(uuid, text) from public;
grant execute on function public.set_team_member_role(uuid, text) to authenticated;

create or replace function public.transfer_team_ownership(p_user uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_team uuid; v_my_role text;
begin
  select m.team_id, m.role into v_team, v_my_role from public.team_members m where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_my_role <> 'owner' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user is null or p_user = v_uid
     or not exists (select 1 from public.team_members x where x.team_id = v_team and x.user_id = p_user) then
    raise exception 'not_member' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.profiles p where p.id = p_user and p.banned_at is not null) then
    raise exception 'banned' using errcode = '42501';
  end if;
  update public.team_members set role = 'admin' where team_id = v_team and user_id = v_uid;
  update public.team_members set role = 'owner' where team_id = v_team and user_id = p_user;
  update public.teams set owner_id = p_user, updated_at = now() where id = v_team;
end $$;
revoke all on function public.transfer_team_ownership(uuid) from public;
grant execute on function public.transfer_team_ownership(uuid) to authenticated;

-- 9) Admin --------------------------------------------------------------------------------------------
create or replace function public.admin_teams(p_limit integer default 200)
returns table (id uuid, name text, status text, seats integer, members integer, pending_invites integer,
               owner_id uuid, owner_email text, note text, created_at timestamptz, activated_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.status, t.seats,
         (select count(*)::int from public.team_members x where x.team_id = t.id),
         (select count(*)::int from public.team_invites i
           where i.team_id = t.id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()),
         t.owner_id, p.email, t.note, t.created_at, t.activated_at, t.updated_at
  from public.teams t
  left join public.profiles p on p.id = t.owner_id
  where public.is_admin()
  order by case t.status when 'pending' then 0 when 'active' then 1 else 2 end, t.created_at desc
  limit greatest(least(coalesce(p_limit, 200), 1000), 1);
$$;
revoke all on function public.admin_teams(integer) from public;
grant execute on function public.admin_teams(integer) to authenticated;

create or replace function public.admin_update_team(p_team uuid, p_status text default null, p_seats integer default null, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status is not null and p_status not in ('pending', 'active', 'canceled') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_seats is not null and (p_seats < 1 or p_seats > 1000) then raise exception 'invalid_seats' using errcode = '22023'; end if;
  update public.teams t set
    status       = coalesce(p_status, t.status),
    seats        = coalesce(p_seats, t.seats),
    note         = case when p_note is null then t.note else nullif(left(btrim(p_note), 500), '') end,
    activated_at = case when p_status = 'active' and t.activated_at is null then now() else t.activated_at end,
    updated_at   = now()
  where t.id = p_team;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.admin_update_team(uuid, text, integer, text) from public;
grant execute on function public.admin_update_team(uuid, text, integer, text) to authenticated;
