-- Prompt.Monster — 0025: admin_funnel admin olmayanlara gerçekten boş dönsün.
-- Supabase SQL Editor'da çalıştırın (0022'den sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
-- Neden: 0022'deki toplam satırı "grouping sets (..., ())" ile üretiliyor. Boş grup kümesi, hiç girdi satırı olmasa da
-- tek bir satır döndürür; bu yüzden admin olmayan biri, değerleri sıfır/boş olan tek bir "toplam" satırı görüyordu
-- (gerçek veri yok, sızıntı yok). "having public.is_admin()" bu satırı da süzer. Fonksiyonun imzası ve gövdesinin geri
-- kalanı 0022 ile aynı; create or replace mevcut yetkileri korur (anon kapalı, authenticated açık).

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
  having public.is_admin()
  order by 1, 6 desc;
$$;

-- Kontrol (tek satır, hepsi true olmalı):
-- select pg_get_functiondef('public.admin_funnel(integer)'::regprocedure) like '%having public.is_admin()%' as fixed,
--        not has_function_privilege('anon', 'public.admin_funnel(integer)', 'execute') as anon_blocked,
--        has_function_privilege('authenticated', 'public.admin_funnel(integer)', 'execute') as auth_ok;
