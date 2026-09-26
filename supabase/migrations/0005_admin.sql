-- Faz 4 — Admin paneli: roller, çalışma zamanı ayarları, admin okuma politikaları, istatistik RPC'leri.
-- Uygulama: Supabase SQL editor'da çalıştır (0001–0004 uygulanmış olmalı).

-- 1) Roller ve hesap durumu ---------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'user' check (role in ('user','admin'));
alter table public.profiles add column if not exists plan_locked boolean not null default false; -- true: webhook planı değiştiremez (manuel Pro/comp)
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists note text;                                 -- admin notu (destek)

-- İlk admin: site sahibi. (Sonradan /admin/users'tan başka admin atanabilir.)
update public.profiles set role = 'admin' where lower(email) = 'mehmetkuru.dev@gmail.com';

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- 2) Çalışma zamanı ayarları (feature flag'ler, limitler, duyuru) ---------------------------
-- Anahtar listesi kodda: src/lib/settings.ts (registry). Burada yalnız override edilen değerler durur.
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
alter table public.app_settings enable row level security;
drop policy if exists "admin settings" on public.app_settings;
create policy "admin settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- Ayar okuma yardımcıları (security definer: RLS'i aşar, yalnız değer döner)
create or replace function public.setting_int(p_key text, p_default integer)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (s.value #>> '{}')::int from public.app_settings s where s.key = p_key and jsonb_typeof(s.value) = 'number'), p_default);
$$;
create or replace function public.setting_bool(p_key text, p_default boolean)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (s.value #>> '{}')::boolean from public.app_settings s where s.key = p_key and jsonb_typeof(s.value) = 'boolean'), p_default);
$$;
revoke all on function public.setting_int(text, integer) from public;
revoke all on function public.setting_bool(text, boolean) from public;

-- Herkese açık ayarlar (duyuru, bakım modu vb.) — layout her istekte okur.
create or replace function public.public_settings()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb)
  from public.app_settings s
  where s.key in ('announcement','announcement_url','maintenance_mode','signup_enabled','share_enabled','checkout_enabled','ai_enabled','ai_model','free_ai_per_day','pro_ai_per_day','pro_ai_per_month','launch_coupon','launch_coupon_text');
$$;
revoke all on function public.public_settings() from public;
grant execute on function public.public_settings() to anon, authenticated;

-- 3) Kota fonksiyonları artık ayarlardan okur (free/pro günlük, pro aylık tavan, AI kill switch, ban) ----
create or replace function public.consume_ai_call(p_endpoint text)
returns table (ok boolean, remaining integer, plan text)
language plpgsql security definer set search_path = public as $$
declare v_plan text; v_banned timestamptz; v_limit int; v_month_limit int; v_used int; v_used_month int;
begin
  select p.plan, p.banned_at into v_plan, v_banned from public.profiles p where p.id = auth.uid();
  if v_plan is null then
    return query select false, 0, 'none'::text; return;
  end if;
  if v_banned is not null then
    return query select false, 0, 'banned'::text; return;
  end if;
  if not public.setting_bool('ai_enabled', true) then
    return query select false, 0, 'disabled'::text; return;
  end if;
  v_limit := case when v_plan = 'pro' then public.setting_int('pro_ai_per_day', 200) else public.setting_int('free_ai_per_day', 3) end;
  select count(*) into v_used from public.ai_usage u
    where u.owner_id = auth.uid() and u.created_at >= date_trunc('day', now());
  if v_used >= v_limit then
    return query select false, 0, v_plan; return;
  end if;
  if v_plan = 'pro' then
    v_month_limit := public.setting_int('pro_ai_per_month', 1500);
    select count(*) into v_used_month from public.ai_usage u
      where u.owner_id = auth.uid() and u.created_at >= date_trunc('month', now());
    if v_used_month >= v_month_limit then
      return query select false, 0, v_plan; return;
    end if;
  end if;
  insert into public.ai_usage (owner_id, endpoint) values (auth.uid(), p_endpoint);
  return query select true, v_limit - v_used - 1, v_plan;
end $$;
revoke all on function public.consume_ai_call(text) from public;
grant execute on function public.consume_ai_call(text) to authenticated;

create or replace function public.ai_usage_today()
returns table (used integer, "limit" integer, plan text)
language sql security definer set search_path = public as $$
  select
    (select count(*)::int from public.ai_usage u where u.owner_id = auth.uid() and u.created_at >= date_trunc('day', now())) as used,
    (case when p.plan = 'pro' then public.setting_int('pro_ai_per_day', 200) else public.setting_int('free_ai_per_day', 3) end) as "limit",
    p.plan
  from public.profiles p where p.id = auth.uid();
$$;
revoke all on function public.ai_usage_today() from public;
grant execute on function public.ai_usage_today() to authenticated;

-- 4) Admin okuma/yazma politikaları (RLS; servis anahtarı gerekmez) ------------------------
drop policy if exists "admin read profiles"       on public.profiles;
drop policy if exists "admin update profiles"     on public.profiles;
drop policy if exists "admin read projects"       on public.projects;
drop policy if exists "admin read generations"    on public.generations;
drop policy if exists "admin read subscriptions"  on public.subscriptions;
drop policy if exists "admin all shared links"    on public.shared_links;
drop policy if exists "admin read usage"          on public.ai_usage;
create policy "admin read profiles"      on public.profiles      for select using (public.is_admin());
create policy "admin update profiles"    on public.profiles      for update using (public.is_admin()) with check (public.is_admin());
create policy "admin read projects"      on public.projects      for select using (public.is_admin());
create policy "admin read generations"   on public.generations   for select using (public.is_admin());
create policy "admin read subscriptions" on public.subscriptions for select using (public.is_admin());
create policy "admin all shared links"   on public.shared_links  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read usage"         on public.ai_usage      for select using (public.is_admin());

-- 5) İstatistik RPC'leri ---------------------------------------------------------------------
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
    'ai_today',          (select count(*) from public.ai_usage where created_at >= date_trunc('day', now())),
    'ai_7d',             (select count(*) from public.ai_usage where created_at >= now() - interval '7 days'),
    'ai_30d',            (select count(*) from public.ai_usage where created_at >= now() - interval '30 days'),
    'ai_month',          (select count(*) from public.ai_usage where created_at >= date_trunc('month', now())),
    'shares_total',      (select count(*) from public.shared_links),
    'share_views',       (select coalesce(sum(views),0) from public.shared_links)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;

-- Günlük seriler (son N gün): kayıt, üretim, AI çağrısı (uç nokta bazında)
create or replace function public.admin_daily(p_days integer default 30)
returns table (day date, signups integer, generations integer, ai_calls integer, ai_enhance integer, ai_suggest integer, ai_refine integer)
language sql stable security definer set search_path = public as $$
  select d::date as day,
    (select count(*)::int from public.profiles p where p.created_at >= d and p.created_at < d + interval '1 day') as signups,
    (select count(*)::int from public.generations g where g.created_at >= d and g.created_at < d + interval '1 day') as generations,
    (select count(*)::int from public.ai_usage u where u.created_at >= d and u.created_at < d + interval '1 day') as ai_calls,
    (select count(*)::int from public.ai_usage u where u.endpoint = 'enhance' and u.created_at >= d and u.created_at < d + interval '1 day') as ai_enhance,
    (select count(*)::int from public.ai_usage u where u.endpoint = 'suggest' and u.created_at >= d and u.created_at < d + interval '1 day') as ai_suggest,
    (select count(*)::int from public.ai_usage u where u.endpoint = 'refine'  and u.created_at >= d and u.created_at < d + interval '1 day') as ai_refine
  from generate_series(date_trunc('day', now()) - (greatest(p_days,1) - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') as d
  where public.is_admin();
$$;
revoke all on function public.admin_daily(integer) from public;
grant execute on function public.admin_daily(integer) to authenticated;

-- Kullanıcı listesi (arama + sayfalama), kullanım sayaçlarıyla
create or replace function public.admin_users(p_search text default null, p_limit integer default 50, p_offset integer default 0)
returns table (
  id uuid, email text, plan text, role text, plan_locked boolean, banned_at timestamptz, note text, created_at timestamptz,
  projects integer, generations integer, ai_30d integer, last_active timestamptz, pro_interest_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.plan, p.role, p.plan_locked, p.banned_at, p.note, p.created_at,
    (select count(*)::int from public.projects x where x.owner_id = p.id) as projects,
    (select count(*)::int from public.generations g where g.owner_id = p.id) as generations,
    (select count(*)::int from public.ai_usage u where u.owner_id = p.id and u.created_at >= now() - interval '30 days') as ai_30d,
    greatest(p.created_at, (select max(g.created_at) from public.generations g where g.owner_id = p.id), (select max(u.created_at) from public.ai_usage u where u.owner_id = p.id)) as last_active,
    p.pro_interest_at
  from public.profiles p
  where public.is_admin()
    and (p_search is null or p_search = '' or p.email ilike '%' || p_search || '%' or p.id::text = p_search)
  order by p.created_at desc
  limit greatest(least(p_limit, 200), 1) offset greatest(p_offset, 0);
$$;
revoke all on function public.admin_users(text, integer, integer) from public;
grant execute on function public.admin_users(text, integer, integer) to authenticated;

-- Abonelikler + e-posta
create or replace function public.admin_subscriptions(p_limit integer default 100)
returns table (
  id uuid, owner_id uuid, email text, provider text, provider_ref text, status text, plan text, customer_ref text,
  portal_url text, current_period_end timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select s.id, s.owner_id, p.email, s.provider, s.provider_ref, s.status, s.plan, s.customer_ref, s.portal_url, s.current_period_end, s.created_at, s.updated_at
  from public.subscriptions s join public.profiles p on p.id = s.owner_id
  where public.is_admin()
  order by s.updated_at desc
  limit greatest(least(p_limit, 500), 1);
$$;
revoke all on function public.admin_subscriptions(integer) from public;
grant execute on function public.admin_subscriptions(integer) to authenticated;

-- Paylaşımlar + sahibi
create or replace function public.admin_shares(p_limit integer default 100)
returns table (slug text, owner_id uuid, email text, name text, project_type text, version integer, views integer, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.slug, l.owner_id, p.email, pr.name, pr.project_type, g.version, l.views, l.created_at
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where public.is_admin()
  order by l.created_at desc
  limit greatest(least(p_limit, 500), 1);
$$;
revoke all on function public.admin_shares(integer) from public;
grant execute on function public.admin_shares(integer) to authenticated;

-- Son üretimler (akış)
create or replace function public.admin_recent_generations(p_limit integer default 20)
returns table (id uuid, email text, name text, project_type text, version integer, format text, lang text, experts text[], created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, p.email, pr.name, pr.project_type, g.version, g.format, g.lang, g.experts, g.created_at
  from public.generations g
  join public.profiles p on p.id = g.owner_id
  join public.projects pr on pr.id = g.project_id
  where public.is_admin()
  order by g.created_at desc
  limit greatest(least(p_limit, 200), 1);
$$;
revoke all on function public.admin_recent_generations(integer) from public;
grant execute on function public.admin_recent_generations(integer) to authenticated;
