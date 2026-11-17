-- 0016 — Arkadaşını Getir (referral programı): davet linki, yönlendirme kaydı, bonus AI kredisi.
-- prompts.chat/Promptmasters analizinden sonraki öneri (bkz. claude/prompter-monster-plan.md).
-- Supabase SQL Editor'da çalıştırın (0001–0015 uygulanmış olmalı). Tekrar çalıştırılabilir (idempotent).
-- DROP gerekmez: yalnızca yeni kolonlar + CREATE OR REPLACE (aynı imzalar) + bir yeni RPC.
--
-- Tasarım: davet linki = https://prompter.monster/?invite=<username> (yeni kod üretmeye gerek yok,
-- 0012'deki herkese açık profil kullanıcı adı zaten benzersiz ve stabil). Parametre adı (invite)
-- bilerek ref/via/code'dan ayrı: attribution.ts'teki sourceFromRequest() ?ref= değerini zaten genel
-- "kanal" alanına (s) yutuyor — davet kodu onunla aynı parametreyi kullansaydı referans eden kişinin
-- kimliği kaybolup genel pazarlama kanalına dönüşürdü.
-- Ödül tetikleyicisi: yönlendirilen kullanıcının İLK gerçek AI eylemi (consume_ai_call → enhance/
-- suggest/refine), salt kayıt değil — çünkü sahte hesap çiftlikleri günlük/aylık kota sınırına zaten
-- çarpar, ve tek seferlik idempotency bayrağı (referral_bonus_granted) ikinci ödülü engeller.

-- 1) profiles: yönlendiren, bonus kota, tek seferlik ödül bayrağı ------------------------------------
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists bonus_ai_credits integer not null default 0;
alter table public.profiles add column if not exists referral_bonus_granted boolean not null default false;
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- 2) handle_new_user — signup_source.inv (davet eden kullanıcı adı) → referred_by -------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_src jsonb := new.raw_user_meta_data -> 'signup_source';
  v_ref_by uuid;
begin
  if v_src is not null and (jsonb_typeof(v_src) <> 'object' or length(v_src::text) > 1000) then
    v_src := null;
  end if;
  if v_src is not null and v_src ->> 'inv' is not null then
    select id into v_ref_by from public.profiles where username = public._slugify(v_src ->> 'inv') limit 1;
    if v_ref_by = new.id then
      v_ref_by := null; -- kendi kendini davet edemez (pratikte new.id henüz mevcut olamaz, savunma amaçlı)
    end if;
  end if;
  insert into public.profiles (id, email, signup_source, referred_by) values (new.id, new.email, v_src, v_ref_by)
  on conflict (id) do nothing;
  return new;
end $$;

-- 3) profiles_guard — yeni alanlar da istemciden değiştirilemez (yalnız trigger/RPC, security definer) -----
create or replace function public.profiles_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.role is distinct from old.role
     or new.plan_locked is distinct from old.plan_locked
     or new.banned_at is distinct from old.banned_at
     or new.note is distinct from old.note
     or new.email is distinct from old.email
     or new.referred_by is distinct from old.referred_by
     or new.bonus_ai_credits is distinct from old.bonus_ai_credits
     or new.referral_bonus_granted is distinct from old.referral_bonus_granted then
    raise exception 'forbidden: protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- 4) consume_ai_call — bonus kota günlük/aylık limite eklenir + ilk AI eyleminde tek seferlik ödül --------
-- İmza aynı (p_endpoint text, p_credits integer, p_source text) → DROP gerekmez.
create or replace function public.consume_ai_call(p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_plan text; v_banned timestamptz;
  v_cost int := greatest(1, least(coalesce(p_credits, 1), 100));
  v_day_limit int; v_month_limit int; v_used int := 0; v_used_month int := 0; v_id bigint;
  v_own_bonus int; v_referred_by uuid; v_bonus_granted boolean; v_reward int;
begin
  if v_uid is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  select p.plan, p.banned_at, coalesce(p.bonus_ai_credits, 0), p.referred_by, coalesce(p.referral_bonus_granted, false)
    into v_plan, v_banned, v_own_bonus, v_referred_by, v_bonus_granted
    from public.profiles p where p.id = v_uid;
  if v_plan is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  if v_banned is not null then
    return query select false, 0, 'banned'::text, null::bigint, 0, 0, 0; return;
  end if;
  if not public.setting_bool('ai_enabled', true) then
    return query select false, 0, 'disabled'::text, null::bigint, 0, 0, 0; return;
  end if;

  -- Aynı kullanıcının eşzamanlı istekleri sırayla işlenir (kota aşımı yarışını önler).
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 7));

  v_day_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_day', 150)
                       else public.setting_int('free_credits_per_day', 5) + v_own_bonus end;
  v_month_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) + v_own_bonus
                         else 0 end;

  select coalesce(sum(u.credits), 0)::int into v_used from public.ai_usage u
    where u.owner_id = v_uid and u.status <> 'failed' and u.created_at >= date_trunc('day', now());
  if v_plan = 'pro' then
    select coalesce(sum(u.credits), 0)::int into v_used_month from public.ai_usage u
      where u.owner_id = v_uid and u.status <> 'failed' and u.created_at >= date_trunc('month', now());
  end if;

  if v_used + v_cost > v_day_limit or (v_plan = 'pro' and v_used_month + v_cost > v_month_limit) then
    return query select false, greatest(v_day_limit - v_used, 0), v_plan, null::bigint, v_day_limit, v_used_month, v_month_limit; return;
  end if;

  insert into public.ai_usage (owner_id, endpoint, credits, plan, status, source)
    values (v_uid, left(coalesce(p_endpoint, 'ai'), 40), v_cost, v_plan, 'pending', left(coalesce(p_source, 'web'), 20))
    returning id into v_id;

  -- Arkadaşını getir ödülü: yönlendirilen kullanıcının İLK AI eylemi → her iki tarafa kalıcı bonus kota.
  if v_referred_by is not null and not v_bonus_granted
     and not exists (select 1 from public.ai_usage u where u.owner_id = v_uid and u.id <> v_id) then
    v_reward := greatest(0, least(public.setting_int('referral_bonus_credits', 5), 1000));
    update public.profiles set bonus_ai_credits = coalesce(bonus_ai_credits, 0) + v_reward, referral_bonus_granted = true where id = v_uid;
    if v_reward > 0 then
      update public.profiles set bonus_ai_credits = coalesce(bonus_ai_credits, 0) + v_reward where id = v_referred_by;
    end if;
  end if;

  return query select true, v_day_limit - v_used - v_cost, v_plan, v_id, v_day_limit,
    case when v_plan = 'pro' then v_used_month + v_cost else 0 end, v_month_limit;
end $$;
revoke all on function public.consume_ai_call(text, integer, text) from public;
grant execute on function public.consume_ai_call(text, integer, text) to authenticated;

-- 5) my_referral_stats — hesap sayfası için: kendi davet linki + kaç arkadaş + kazanılan bonus ----------
create or replace function public.my_referral_stats()
returns table (username text, invited_signups integer, invited_confirmed integer, bonus_ai_credits integer, bonus_per_referral integer)
language sql stable security definer set search_path = public as $$
  select p.username,
         (select count(*)::int from public.profiles r where r.referred_by = p.id),
         (select count(*)::int from public.profiles r where r.referred_by = p.id and r.referral_bonus_granted),
         coalesce(p.bonus_ai_credits, 0),
         public.setting_int('referral_bonus_credits', 5)
  from public.profiles p
  where p.id = auth.uid();
$$;
revoke all on function public.my_referral_stats() from public;
grant execute on function public.my_referral_stats() to authenticated;
