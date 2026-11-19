-- Prompt.Monster — 0024: Haftalık admin özeti (her pazartesi e-posta) için tek okuma fonksiyonu.
-- Supabase SQL Editor'da çalıştırın (0023'ten sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
-- Yalnız servis rolü çağırır (saatlik cron ve Admin → E-postalar sunucu tarafı); anon/authenticated erişemez.

create or replace function public.admin_weekly_summary(p_days integer default 7)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  n  integer := greatest(least(coalesce(p_days, 7), 90), 1);
  t1 timestamptz := now();
  t0 timestamptz := now() - n * interval '1 day';
  tp timestamptz := now() - 2 * n * interval '1 day';
  r  jsonb;
begin
  select jsonb_build_object(
    'days', n,
    'from', t0,
    'to', t1,
    -- Alıcılar: admin rolündeki, yasaklı olmayan hesapların e-postaları
    'recipients', coalesce((
      select jsonb_agg(u.email order by u.created_at)
      from auth.users u
      join public.profiles p on p.id = u.id
      where p.role = 'admin' and p.banned_at is null and u.email is not null and u.deleted_at is null
    ), '[]'::jsonb),
    'users_total',        (select count(*) from public.profiles),
    'signups',            (select count(*) from public.profiles where created_at >= t0),
    'signups_prev',       (select count(*) from public.profiles where created_at >= tp and created_at < t0),
    -- Aktif kullanıcı: dönemde proje oluşturan, versiyon üreten ya da AI kullanan giriş yapmış hesap
    -- (iki dönem aynı tanımla; updated_at geçmişi tutmadığı için kullanılmıyor)
    'active_users', (select count(distinct x.owner_id) from (
        select owner_id from public.projects where created_at >= t0
        union all select owner_id from public.generations where created_at >= t0
        union all select owner_id from public.ai_usage where created_at >= t0 and status <> 'failed' and owner_id is not null
      ) x),
    'active_users_prev', (select count(distinct x.owner_id) from (
        select owner_id from public.generations where created_at >= tp and created_at < t0
        union all select owner_id from public.ai_usage where created_at >= tp and created_at < t0 and status <> 'failed' and owner_id is not null
        union all select owner_id from public.projects where created_at >= tp and created_at < t0
      ) x),
    'projects_new',       (select count(*) from public.projects where created_at >= t0),
    'generations',        (select count(*) from public.generations where created_at >= t0),
    'generations_prev',   (select count(*) from public.generations where created_at >= tp and created_at < t0),
    'generators',         (select count(distinct owner_id) from public.generations where created_at >= t0),
    'ai_calls',           (select count(*) from public.ai_usage where status <> 'failed' and created_at >= t0),
    'ai_calls_prev',      (select count(*) from public.ai_usage where status <> 'failed' and created_at >= tp and created_at < t0),
    'ai_anon',            (select count(*) from public.ai_usage where status <> 'failed' and owner_id is null and created_at >= t0),
    'ai_failed',          (select count(*) from public.ai_usage where status = 'failed' and created_at >= t0),
    'credits',            (select coalesce(sum(credits), 0) from public.ai_usage where status <> 'failed' and created_at >= t0),
    'tokens_in',          (select coalesce(sum(input_tokens), 0) from public.ai_usage where created_at >= t0),
    'tokens_out',         (select coalesce(sum(output_tokens), 0) from public.ai_usage where created_at >= t0),
    'shares_new',         (select count(*) from public.shared_links where created_at >= t0),
    'shares_listed_new',  (select count(*) from public.shared_links where listed and listed_at >= t0),
    'share_views_total',  (select coalesce(sum(views), 0) from public.shared_links),
    'pro_interest_new',   (select count(*) from public.profiles where pro_interest_at >= t0),
    'subs_active',        (select count(*) from public.subscriptions where status in ('active', 'on_trial', 'past_due')),
    'subs_new',           (select count(*) from public.subscriptions where created_at >= t0),
    'subs_ended_new',     (select count(*) from public.subscriptions where status in ('cancelled', 'expired', 'unpaid') and updated_at >= t0),
    'teams_active',       (select count(*) from public.teams where status = 'active'),
    'teams_new',          (select count(*) from public.teams where created_at >= t0),
    'feedback_new',       (select count(*) from public.feedback where created_at >= t0),
    'emails_sent',        (select count(*) from public.email_log where status = 'sent' and updated_at >= t0),
    'emails_failed',      (select count(*) from public.email_log where status = 'failed' and updated_at >= t0),
    'optouts_new',        (select count(*) from public.email_prefs where opt_out_at >= t0),
    -- Kaynaklar: ham signup_source alanları; etiketi uygulama verir (src/lib/attribution.ts channelOf)
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('s', x.s, 'r', x.r, 'code', x.code, 'invited', x.invited, 'n', x.n) order by x.n desc)
      from (
        select coalesce(p.signup_source ->> 's', '') as s, coalesce(p.signup_source ->> 'r', '') as r,
               coalesce(p.signup_source ->> 'code', '') as code, (p.referred_by is not null) as invited, count(*)::int as n
        from public.profiles p
        where p.created_at >= t0
        group by 1, 2, 3, 4
        order by 5 desc
        limit 50
      ) x
    ), '[]'::jsonb),
    -- En çok versiyon üretilen proje tipleri
    'top_types', coalesce((
      select jsonb_agg(jsonb_build_object('type', x.type, 'n', x.n) order by x.n desc)
      from (
        select coalesce(nullif(pr.project_type, ''), '?') as type, count(*)::int as n
        from public.generations g
        join public.projects pr on pr.id = g.project_id
        where g.created_at >= t0
        group by 1
        order by 2 desc
        limit 5
      ) x
    ), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_weekly_summary(integer) from public, anon, authenticated;
grant execute on function public.admin_weekly_summary(integer) to service_role;

-- Kontrol (tek satır, hepsi true olmalı):
-- select has_function_privilege('service_role', 'public.admin_weekly_summary(integer)', 'execute') as service_ok,
--        not has_function_privilege('authenticated', 'public.admin_weekly_summary(integer)', 'execute') as auth_blocked,
--        not has_function_privilege('anon', 'public.admin_weekly_summary(integer)', 'execute') as anon_blocked,
--        jsonb_typeof(public.admin_weekly_summary(7) -> 'recipients') = 'array' as works;
