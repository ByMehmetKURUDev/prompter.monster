-- 0008 — Public API + MCP sunucusu: API anahtarları, anahtar sahibine kredi harcatma, yeni herkese açık ayarlar.
-- Uygulama: Supabase SQL editor'da bir kez çalıştır (0001–0007 uygulanmış olmalı). Tekrar çalıştırılabilir.

-- 1) API anahtarları ---------------------------------------------------------------------------
-- Anahtarın kendisi saklanmaz; yalnız SHA-256 özeti ve ekranda gösterilecek ön eki tutulur.
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null default 'API key',
  prefix       text not null,
  key_hash     text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  calls        bigint not null default 0,
  revoked_at   timestamptz
);
create index if not exists api_keys_owner_idx on public.api_keys (owner_id);
alter table public.api_keys enable row level security;
drop policy if exists "own api keys read" on public.api_keys;
create policy "own api keys read" on public.api_keys for select using (auth.uid() = owner_id);
drop policy if exists "admin api keys read" on public.api_keys;
create policy "admin api keys read" on public.api_keys for select using (public.is_admin());
-- Oluşturma / iptal / kullanım sayacı yalnız sunucuda (service role) yapılır; kullanıcıya yazma politikası yok.

-- Anahtar → sahip çözümleme: tek çağrıda doğrular, istek sayacını artırır, plan/ban bilgisini döner (yalnız service role).
create or replace function public.resolve_api_key(p_hash text)
returns table (key_id uuid, owner_id uuid, plan text, banned boolean)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_owner uuid;
begin
  update public.api_keys k set calls = k.calls + 1, last_used_at = now()
    where k.key_hash = p_hash and k.revoked_at is null
    returning k.id, k.owner_id into v_id, v_owner;
  if v_id is null then return; end if;
  return query select v_id, v_owner, p.plan, (p.banned_at is not null) from public.profiles p where p.id = v_owner;
end $$;
revoke all on function public.resolve_api_key(text) from public;
revoke all on function public.resolve_api_key(text) from anon, authenticated;
grant execute on function public.resolve_api_key(text) to service_role;

-- Günlük API / MCP çağrı sayaçları (uç nokta / araç başına; anahtarlı mı anahtarsız mı). Admin panelinde grafik.
create table if not exists public.api_call_stats (
  day   date    not null default current_date,
  kind  text    not null,
  name  text    not null,
  keyed boolean not null default false,
  calls bigint  not null default 0,
  primary key (day, kind, name, keyed)
);
alter table public.api_call_stats enable row level security;
drop policy if exists "admin api stats read" on public.api_call_stats;
create policy "admin api stats read" on public.api_call_stats for select using (public.is_admin());

create or replace function public.log_api_call(p_kind text, p_name text, p_keyed boolean default false)
returns void
language sql security definer set search_path = public as $$
  insert into public.api_call_stats (day, kind, name, keyed, calls)
  values (current_date, left(coalesce(p_kind, 'api'), 10), left(coalesce(p_name, '?'), 60), coalesce(p_keyed, false), 1)
  on conflict (day, kind, name, keyed) do update set calls = public.api_call_stats.calls + 1;
$$;
revoke all on function public.log_api_call(text, text, boolean) from public;
revoke all on function public.log_api_call(text, text, boolean) from anon, authenticated;
grant execute on function public.log_api_call(text, text, boolean) to service_role;

-- 2) Kredi harcama çekirdeği: kullanıcı kimliği parametreyle (API anahtarı → sahibi) -----------------
create or replace function public.consume_ai_credits(p_uid uuid, p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language plpgsql security definer set search_path = public as $$
declare
  v_plan text; v_banned timestamptz;
  v_cost int := greatest(1, least(coalesce(p_credits, 1), 100));
  v_day_limit int; v_month_limit int; v_used int := 0; v_used_month int := 0; v_id bigint;
begin
  if p_uid is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  select p.plan, p.banned_at into v_plan, v_banned from public.profiles p where p.id = p_uid;
  if v_plan is null then
    return query select false, 0, 'none'::text, null::bigint, 0, 0, 0; return;
  end if;
  if v_banned is not null then
    return query select false, 0, 'banned'::text, null::bigint, 0, 0, 0; return;
  end if;
  if not public.setting_bool('ai_enabled', true) then
    return query select false, 0, 'disabled'::text, null::bigint, 0, 0, 0; return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 7));

  v_day_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_day', 150) else public.setting_int('free_credits_per_day', 5) end;
  v_month_limit := case when v_plan = 'pro' then public.setting_int('pro_credits_per_month', 1000) else 0 end;

  select coalesce(sum(u.credits), 0)::int into v_used from public.ai_usage u
    where u.owner_id = p_uid and u.status <> 'failed' and u.created_at >= date_trunc('day', now());
  if v_plan = 'pro' then
    select coalesce(sum(u.credits), 0)::int into v_used_month from public.ai_usage u
      where u.owner_id = p_uid and u.status <> 'failed' and u.created_at >= date_trunc('month', now());
  end if;

  if v_used + v_cost > v_day_limit or (v_plan = 'pro' and v_used_month + v_cost > v_month_limit) then
    return query select false, greatest(v_day_limit - v_used, 0), v_plan, null::bigint, v_day_limit, v_used_month, v_month_limit; return;
  end if;

  insert into public.ai_usage (owner_id, endpoint, credits, plan, status, source)
    values (p_uid, left(coalesce(p_endpoint, 'ai'), 40), v_cost, v_plan, 'pending', left(coalesce(p_source, 'web'), 20))
    returning id into v_id;

  return query select true, v_day_limit - v_used - v_cost, v_plan, v_id, v_day_limit,
    case when v_plan = 'pro' then v_used_month + v_cost else 0 end, v_month_limit;
end $$;
-- Yalnız sunucu (service role) çağırabilir; kullanıcılar kendi adlarına consume_ai_call'u kullanır.
revoke all on function public.consume_ai_credits(uuid, text, integer, text) from public;
revoke all on function public.consume_ai_credits(uuid, text, integer, text) from anon, authenticated;
grant execute on function public.consume_ai_credits(uuid, text, integer, text) to service_role;

-- Oturumlu kullanıcı yolu artık aynı çekirdeği kullanır (davranış 0007 ile aynı).
create or replace function public.consume_ai_call(p_endpoint text, p_credits integer default 1, p_source text default 'web')
returns table (ok boolean, remaining integer, plan text, usage_id bigint, day_limit integer, month_used integer, month_limit integer)
language sql security definer set search_path = public as $$
  select * from public.consume_ai_credits(auth.uid(), p_endpoint, p_credits, p_source);
$$;
revoke all on function public.consume_ai_call(text, integer, text) from public;
grant execute on function public.consume_ai_call(text, integer, text) to authenticated;

-- 3) Herkese açık ayarlar: İngilizce duyuru + entegrasyon anahtarları -------------------------------
create or replace function public.public_settings()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb)
  from public.app_settings s
  where s.key in (
    'announcement','announcement_en','announcement_url','maintenance_mode','signup_enabled','share_enabled','checkout_enabled','ai_enabled',
    'launch_coupon','launch_coupon_text',
    'anon_credits_per_day','free_credits_per_day','pro_credits_per_day','pro_credits_per_month',
    'credit_cost_enhance','credit_cost_suggest','credit_cost_refine',
    'api_enabled','mcp_enabled'
  ) or s.key like 'legal\_%';
$$;
revoke all on function public.public_settings() from public;
grant execute on function public.public_settings() to anon, authenticated;

-- 4) Admin: API kullanımı ---------------------------------------------------------------------------
create or replace function public.admin_api_keys(p_limit integer default 100)
returns table (id uuid, email text, plan text, name text, prefix text, created_at timestamptz, last_used_at timestamptz, calls bigint, revoked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select k.id, p.email, p.plan, k.name, k.prefix, k.created_at, k.last_used_at, k.calls, k.revoked_at
  from public.api_keys k join public.profiles p on p.id = k.owner_id
  where public.is_admin()
  order by coalesce(k.last_used_at, k.created_at) desc
  limit greatest(least(p_limit, 500), 1);
$$;
revoke all on function public.admin_api_keys(integer) from public;
grant execute on function public.admin_api_keys(integer) to authenticated;

-- AI kredisinin kaynağa göre dağılımı (web / api / mcp) — admin API sayfası.
create or replace function public.admin_usage_sources(p_days integer default 30)
returns table (source text, calls bigint, credits bigint, tokens_in bigint, tokens_out bigint, users bigint)
language sql stable security definer set search_path = public as $$
  select u.source, count(*)::bigint, coalesce(sum(u.credits), 0)::bigint,
         coalesce(sum(u.input_tokens), 0)::bigint, coalesce(sum(u.output_tokens), 0)::bigint,
         count(distinct u.owner_id)::bigint
  from public.ai_usage u
  where public.is_admin()
    and u.status <> 'failed'
    and u.created_at >= now() - make_interval(days => greatest(least(p_days, 365), 1))
  group by u.source
  order by 2 desc;
$$;
revoke all on function public.admin_usage_sources(integer) from public;
grant execute on function public.admin_usage_sources(integer) to authenticated;
