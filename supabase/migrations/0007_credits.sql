-- 0007 — Kredi sistemi, gerçek token kaydı, plana göre model, kanal (attribution) istatistikleri.
-- Uygulama: Supabase SQL editor'da bir kez çalıştır (0001–0006 uygulanmış olmalı). Tekrar çalıştırılabilir.
--
-- Kredi: enhance 1, stack önerisi 1, iyileştir 3 (admin → Ayarlar → Krediler'den değişir).
-- Free: günde 5 kredi · Pro: ayda 1.000 kredi (günde en fazla 150) · Ziyaretçi: IP başına günde 3 (KV'de).

-- 1) ai_usage: kredi, model, plan, durum, kaynak ------------------------------------------------
alter table public.ai_usage add column if not exists credits integer not null default 1;
alter table public.ai_usage add column if not exists model   text;
alter table public.ai_usage add column if not exists plan    text;                       -- anon | free | pro
alter table public.ai_usage add column if not exists status  text not null default 'ok'; -- pending | ok | failed (failed = kredi iade)
alter table public.ai_usage add column if not exists source  text not null default 'web'; -- web | api | mcp | extension
create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);

-- 2) profiles: kayıt kaynağı (utm / ref / indirim kodu) -----------------------------------------
alter table public.profiles add column if not exists signup_source jsonb;

-- Kayıt formu, kaynağı user_metadata.signup_source olarak gönderir; profil oluşurken kopyalanır.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_src jsonb := new.raw_user_meta_data -> 'signup_source';
begin
  if v_src is not null and (jsonb_typeof(v_src) <> 'object' or length(v_src::text) > 1000) then
    v_src := null;
  end if;
  insert into public.profiles (id, email, signup_source) values (new.id, new.email, v_src)
  on conflict (id) do nothing;
  return new;
end $$;

-- 3) Ayar yardımcısı (metin) -------------------------------------------------------------------------
create or replace function public.setting_text(p_key text, p_default text)
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select s.value #>> '{}' from public.app_settings s where s.key = p_key and jsonb_typeof(s.value) = 'string'), p_default);
$$;
revoke all on function public.setting_text(text, text) from public;

-- 4) Herkese açık ayarlar: kredi anahtarları + yasal bilgiler ------------------------------------------
create or replace function public.public_settings()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb)
  from public.app_settings s
  where s.key in (
    'announcement','announcement_url','maintenance_mode','signup_enabled','share_enabled','checkout_enabled','ai_enabled',
    'launch_coupon','launch_coupon_text',
    'anon_credits_per_day','free_credits_per_day','pro_credits_per_day','pro_credits_per_month',
    'credit_cost_enhance','credit_cost_suggest','credit_cost_refine',
    'api_enabled','mcp_enabled'
  ) or s.key like 'legal\_%';
$$;
revoke all on function public.public_settings() from public;
grant execute on function public.public_settings() to anon, authenticated;

-- 5) Kredi ağırlıklı kota --------------------------------------------------------------------------
-- Eski imza (text) kaldırılır; sunucu artık maliyeti (p_credits) ve kaynağı gönderir.
drop function if exists public.consume_ai_call(text);
create or replace function public.consume_ai_call(p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_plan text; v_banned timestamptz;
  v_cost int := greatest(1, least(coalesce(p_credits, 1), 100));
  v_day_limit int; v_month_limit int; v_used int := 0; v_used_month int := 0; v_id bigint;
begin
  if v_uid is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  select p.plan, p.banned_at into v_plan, v_banned from public.profiles p where p.id = v_uid;
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

  v_day_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_day', 150) else public.setting_int('free_credits_per_day', 5) end;
  v_month_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) else 0 end;

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

  return query select true, v_day_limit - v_used - v_cost, v_plan, v_id, v_day_limit,
    case when v_plan = 'pro' then v_used_month + v_cost else 0 end, v_month_limit;
end $$;
revoke all on function public.consume_ai_call(text, integer, text) from public;
grant execute on function public.consume_ai_call(text, integer, text) to authenticated;

drop function if exists public.ai_usage_today();
create or replace function public.ai_usage_today()
returns table (used integer, "limit" integer, plan text, month_used integer, month_limit integer)
language sql stable security definer set search_path = public as $$
  select
    (select coalesce(sum(u.credits), 0)::int from public.ai_usage u
      where u.owner_id = auth.uid() and u.status <> 'failed' and u.created_at >= date_trunc('day', now())) as used,
    (case when p.plan = 'pro' then public.setting_int('pro_credits_per_day', 150) else public.setting_int('free_credits_per_day', 5) end) as "limit",
    p.plan,
    (select coalesce(sum(u.credits), 0)::int from public.ai_usage u
      where u.owner_id = auth.uid() and u.status <> 'failed' and u.created_at >= date_trunc('month', now())) as month_used,
    (case when p.plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) else 0 end) as month_limit
  from public.profiles p where p.id = auth.uid();
$$;
revoke all on function public.ai_usage_today() from public;
grant execute on function public.ai_usage_today() to authenticated;

-- 6) Admin istatistikleri: kredi + token --------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users_total',       (select count(*) from public.profiles),
    'users_7d',          (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'users_30d',         (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'users_pro',         (select count(*) from public.profiles where plan = 'pro'),
    'users_banned',      (select count(*) from public.profiles where banned_at is not null),
    'pro_interest',      (select count(*) from public.profiles where pro_interest_at is not null),
    'subs_active',       (select count(*) from public.subscriptions where status in ('active','on_trial','past_due')),
    'subs_monthly',      (select count(*) from public.subscriptions where status in ('active','on_trial','past_due') and plan = 'monthly'),
    'subs_yearly',       (select count(*) from public.subscriptions where status in ('active','on_trial','past_due') and plan = 'yearly'),
    'subs_cancelled',    (select count(*) from public.subscriptions where status in ('cancelled','expired','unpaid')),
    'projects_total',    (select count(*) from public.projects),
    'projects_7d',       (select count(*) from public.projects where created_at >= now() - interval '7 days'),
    'generations_total', (select count(*) from public.generations),
    'generations_7d',    (select count(*) from public.generations where created_at >= now() - interval '7 days'),
    'generations_today', (select count(*) from public.generations where created_at >= date_trunc('day', now())),
    'ai_today',          (select count(*) from public.ai_usage where status <> 'failed' and created_at >= date_trunc('day', now())),
    'ai_7d',             (select count(*) from public.ai_usage where status <> 'failed' and created_at >= now() - interval '7 days'),
    'ai_30d',            (select count(*) from public.ai_usage where status <> 'failed' and created_at >= now() - interval '30 days'),
    'ai_month',          (select count(*) from public.ai_usage where status <> 'failed' and created_at >= date_trunc('month', now())),
    'ai_failed_7d',      (select count(*) from public.ai_usage where status = 'failed' and created_at >= now() - interval '7 days'),
    'ai_anon_today',     (select count(*) from public.ai_usage where owner_id is null and status <> 'failed' and created_at >= date_trunc('day', now())),
    'credits_today',     (select coalesce(sum(credits),0) from public.ai_usage where status <> 'failed' and created_at >= date_trunc('day', now())),
    'credits_month',     (select coalesce(sum(credits),0) from public.ai_usage where status <> 'failed' and created_at >= date_trunc('month', now())),
    'tokens_in_month',   (select coalesce(sum(input_tokens),0) from public.ai_usage where created_at >= date_trunc('month', now())),
    'tokens_out_month',  (select coalesce(sum(output_tokens),0) from public.ai_usage where created_at >= date_trunc('month', now())),
    'shares_total',      (select count(*) from public.shared_links),
    'share_views',       (select coalesce(sum(views),0) from public.shared_links)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

drop function if exists public.admin_daily(integer);
create or replace function public.admin_daily(p_days integer default 30)
returns table (
  day date, signups integer, generations integer, ai_calls integer, ai_enhance integer, ai_suggest integer, ai_refine integer,
  credits integer, tokens_in bigint, tokens_out bigint, anon_calls integer, failed integer
)
language sql stable security definer set search_path = public as $$
  with days as (
    select d::date as day, d as d0, d + interval '1 day' as d1
    from generate_series(date_trunc('day', now()) - (greatest(least(p_days, 365), 1) - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') as d
  )
  select x.day,
    (select count(*)::int from public.profiles p where p.created_at >= x.d0 and p.created_at < x.d1),
    (select count(*)::int from public.generations g where g.created_at >= x.d0 and g.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.status <> 'failed' and u.created_at >= x.d0 and u.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.status <> 'failed' and u.endpoint = 'enhance' and u.created_at >= x.d0 and u.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.status <> 'failed' and u.endpoint = 'suggest' and u.created_at >= x.d0 and u.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.status <> 'failed' and u.endpoint = 'refine'  and u.created_at >= x.d0 and u.created_at < x.d1),
    (select coalesce(sum(u.credits),0)::int from public.ai_usage u where u.status <> 'failed' and u.created_at >= x.d0 and u.created_at < x.d1),
    (select coalesce(sum(u.input_tokens),0)::bigint from public.ai_usage u where u.created_at >= x.d0 and u.created_at < x.d1),
    (select coalesce(sum(u.output_tokens),0)::bigint from public.ai_usage u where u.created_at >= x.d0 and u.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.owner_id is null and u.status <> 'failed' and u.created_at >= x.d0 and u.created_at < x.d1),
    (select count(*)::int from public.ai_usage u where u.status = 'failed' and u.created_at >= x.d0 and u.created_at < x.d1)
  from days x
  where public.is_admin()
  order by x.day;
$$;
revoke all on function public.admin_daily(integer) from public;
grant execute on function public.admin_daily(integer) to authenticated;

-- Gerçek maliyet için model bazında token toplamları
create or replace function public.admin_usage_models(p_days integer default 30)
returns table (model text, plan text, calls integer, credits integer, tokens_in bigint, tokens_out bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(u.model, '(bilinmiyor)'), coalesce(u.plan, '?'), count(*)::int, coalesce(sum(u.credits),0)::int,
         coalesce(sum(u.input_tokens),0)::bigint, coalesce(sum(u.output_tokens),0)::bigint
  from public.ai_usage u
  where public.is_admin() and u.created_at >= now() - (greatest(least(p_days, 365), 1) * interval '1 day')
  group by 1, 2
  order by 3 desc;
$$;
revoke all on function public.admin_usage_models(integer) from public;
grant execute on function public.admin_usage_models(integer) to authenticated;

drop function if exists public.admin_users(text, integer, integer);
create or replace function public.admin_users(p_search text default null, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, email text, plan text, role text, plan_locked boolean, banned_at timestamptz, note text, created_at timestamptz,
  projects integer, generations integer, ai_30d integer, credits_30d integer, last_active timestamptz, pro_interest_at timestamptz,
  signup_source jsonb
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.plan, p.role, p.plan_locked, p.banned_at, p.note, p.created_at,
    (select count(*)::int from public.projects x where x.owner_id = p.id),
    (select count(*)::int from public.generations g where g.owner_id = p.id),
    (select count(*)::int from public.ai_usage u where u.owner_id = p.id and u.status <> 'failed' and u.created_at >= now() - interval '30 days'),
    (select coalesce(sum(u.credits),0)::int from public.ai_usage u where u.owner_id = p.id and u.status <> 'failed' and u.created_at >= now() - interval '30 days'),
    greatest(p.created_at, (select max(g.created_at) from public.generations g where g.owner_id = p.id), (select max(u.created_at) from public.ai_usage u where u.owner_id = p.id)),
    p.pro_interest_at,
    p.signup_source
  from public.profiles p
  where public.is_admin()
    and (p_search is null or p_search = '' or p.email ilike '%' || p_search || '%' or p.id::text = p_search)
  order by p.created_at desc
  limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0);
$$;
revoke all on function public.admin_users(text, integer, integer) from public;
grant execute on function public.admin_users(text, integer, integer) to authenticated;

-- 7) Kanallar: kaynak / kod bazında kayıt ve Pro dönüşümü ------------------------------------------------
create or replace function public.admin_channels(p_days integer default 90)
returns table (source text, medium text, campaign text, referrer text, code text, signups integer, pro integer, active_subs integer, first_seen timestamptz, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  select
    coalesce(p.signup_source ->> 's', ''),
    coalesce(p.signup_source ->> 'm', ''),
    coalesce(p.signup_source ->> 'c', ''),
    coalesce(p.signup_source ->> 'r', ''),
    coalesce(p.signup_source ->> 'code', ''),
    count(*)::int,
    count(*) filter (where p.plan = 'pro')::int,
    count(*) filter (where exists (select 1 from public.subscriptions s where s.owner_id = p.id and s.status in ('active','on_trial','past_due')))::int,
    min(p.created_at), max(p.created_at)
  from public.profiles p
  where public.is_admin() and p.created_at >= now() - (greatest(least(p_days, 3650), 1) * interval '1 day')
  group by 1, 2, 3, 4, 5
  order by 6 desc;
$$;
revoke all on function public.admin_channels(integer) from public;
grant execute on function public.admin_channels(integer) to authenticated;

-- Satın alma anındaki kanal/kod (checkout custom data → webhook raw)
create or replace function public.admin_channel_sales(p_days integer default 90)
returns table (channel text, code text, subscriptions integer, active integer, monthly integer, yearly integer)
language sql stable security definer set search_path = public as $$
  select
    coalesce(s.raw -> 'meta' -> 'custom_data' ->> 'channel', 'direct'),
    coalesce(s.raw -> 'meta' -> 'custom_data' ->> 'code', ''),
    count(*)::int,
    count(*) filter (where s.status in ('active','on_trial','past_due'))::int,
    count(*) filter (where s.plan = 'monthly')::int,
    count(*) filter (where s.plan = 'yearly')::int
  from public.subscriptions s
  where public.is_admin() and s.created_at >= now() - (greatest(least(p_days, 3650), 1) * interval '1 day')
  group by 1, 2
  order by 3 desc;
$$;
revoke all on function public.admin_channel_sales(integer) from public;
grant execute on function public.admin_channel_sales(integer) to authenticated;
