-- Prompt.Monster — 0022: Admin huni panosu — kayıt → proje → üretim → AI → paylaşım → Pro ilgisi → ödeme.
-- Supabase SQL Editor'da çalıştırın (0021'den sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez;
-- yalnız okuma fonksiyonları. İkisi de is_admin() ile süzülür: admin olmayan herkese boş döner.

-- 1) Kohort hunisi: son p_days günde kaydolanlar, kaynak (signup_source) + davet ile gruplu; son satır toplam ----------
create or replace function public.admin_funnel(p_days integer default 30)
returns table (is_total boolean, source text, referrer text, code text, invited boolean, signups integer, saved integer,
               generated integer, used_ai integer, shared integer, pro_interest integer, paid integer, gen_hours_median numeric)
language sql stable security definer set search_path = public as $$
  with cohort as (
    select p.id, p.created_at, p.plan, p.pro_interest_at,
           coalesce(p.signup_source ->> 's', '') as source,
           coalesce(p.signup_source ->> 'r', '') as referrer,
           coalesce(p.signup_source ->> 'code', '') as code,
           (p.referred_by is not null) as invited
    from public.profiles p
    where public.is_admin()
      and p.created_at >= now() - (greatest(least(coalesce(p_days, 30), 3650), 1) * interval '1 day')
  ), steps as (
    select c.*,
           exists (select 1 from public.projects x where x.owner_id = c.id) as has_project,
           (select min(g.created_at) from public.generations g where g.owner_id = c.id) as first_gen,
           exists (select 1 from public.ai_usage a where a.owner_id = c.id and a.status <> 'failed') as has_ai,
           exists (select 1 from public.shared_links s where s.owner_id = c.id) as has_share,
           (c.plan = 'pro' or exists (select 1 from public.subscriptions s
                                       where s.owner_id = c.id and s.status in ('active', 'on_trial', 'past_due'))) as is_paid
    from cohort c
  )
  select grouping(source) = 1, source, referrer, code, invited,
         count(*)::int,
         count(*) filter (where has_project)::int,
         count(*) filter (where first_gen is not null)::int,
         count(*) filter (where has_ai)::int,
         count(*) filter (where has_share)::int,
         count(*) filter (where pro_interest_at is not null)::int,
         count(*) filter (where is_paid)::int,
         round((percentile_cont(0.5) within group (order by extract(epoch from (first_gen - created_at)) / 3600.0))::numeric, 1)
  from steps
  group by grouping sets ((source, referrer, code, invited), ())
  order by 1, 6 desc;
$$;
revoke all on function public.admin_funnel(integer) from public, anon;
grant execute on function public.admin_funnel(integer) to authenticated;

-- 2) Günlük etkinlik (yerel gün, varsayılan Europe/Istanbul): kayıt, üreten kişi, versiyon, AI çağrısı, paylaşım, Pro ilgisi
create or replace function public.admin_activity_daily(p_days integer default 30, p_tz text default 'Europe/Istanbul')
returns table (day date, signups integer, generators integer, generations integer, ai_calls integer, shares integer, pro_interest integer)
language sql stable security definer set search_path = public as $$
  with b as (
    select greatest(least(coalesce(p_days, 30), 365), 1) as n, coalesce(nullif(p_tz, ''), 'Europe/Istanbul') as tz
  ), d as (
    select gs::date as day, b.tz,
           (gs::date)::timestamp at time zone b.tz as t0,
           (gs::date + 1)::timestamp at time zone b.tz as t1
    from b, generate_series((now() at time zone b.tz)::date - (b.n - 1), (now() at time zone b.tz)::date, interval '1 day') gs
  )
  select d.day,
         (select count(*) from public.profiles p where p.created_at >= d.t0 and p.created_at < d.t1)::int,
         (select count(distinct g.owner_id) from public.generations g where g.created_at >= d.t0 and g.created_at < d.t1)::int,
         (select count(*) from public.generations g where g.created_at >= d.t0 and g.created_at < d.t1)::int,
         (select count(*) from public.ai_usage a where a.status <> 'failed' and a.created_at >= d.t0 and a.created_at < d.t1)::int,
         (select count(*) from public.shared_links s where s.created_at >= d.t0 and s.created_at < d.t1)::int,
         (select count(*) from public.profiles p where p.pro_interest_at >= d.t0 and p.pro_interest_at < d.t1)::int
  from d
  where public.is_admin()
  order by d.day;
$$;
revoke all on function public.admin_activity_daily(integer, text) from public, anon;
grant execute on function public.admin_activity_daily(integer, text) to authenticated;

-- Kontrol (tek satır, hepsi true olmalı):
-- select has_function_privilege('authenticated', 'public.admin_funnel(integer)', 'execute') as auth_ok,
--        not has_function_privilege('anon', 'public.admin_funnel(integer)', 'execute') as anon_blocked,
--        not has_function_privilege('anon', 'public.admin_activity_daily(integer, text)', 'execute') as anon_blocked_daily;
