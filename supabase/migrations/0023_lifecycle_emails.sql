-- Prompt.Monster — 0023: Karşılama ve başlangıç hatırlatması e-postaları (Resend).
-- Supabase SQL Editor'da çalıştırın (0022'den sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
--
-- İki e-posta, ikisi de hesabın kullanımına dair bilgilendirme (kampanya / indirim içermez):
--   welcome — e-postası doğrulanmış yeni hesaplara bir kez (kayıttan sonraki ilk 3 gün içinde)
--   nudge   — 1–7 günlük ve henüz hiç proje kaydetmemiş hesaplara bir kez; karşılamadan en az 20 saat sonra
-- Veritabanı yalnız "kime, hangi e-posta" kararını ve kaydını tutar; gönderimi uygulama yapar (saatlik cron +
-- girişten hemen sonra hızlı yol). email_log'da (user_id, kind) tekil: aynı e-posta aynı kişiye iki kez gitmez.
-- Çıkış: her e-postadaki bağlantı (email_prefs.token, tahmin edilemez) ya da Hesabım → E-posta tercihleri.
-- İki tabloda da RLS açık ve politika yok — erişim yalnız aşağıdaki SECURITY DEFINER fonksiyonlarla.

create table if not exists public.email_prefs (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  token       uuid not null default gen_random_uuid() unique,  -- abonelikten çıkış bağlantısındaki anahtar
  locale      text check (locale in ('tr', 'en')),              -- null: kayıt dilinden tahmin, yoksa tr
  opt_out_at  timestamptz,                                      -- dolu: karşılama / hatırlatma gönderilmez
  updated_at  timestamptz not null default now()
);

create table if not exists public.email_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('welcome', 'nudge')),
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts    integer not null default 1,
  provider_id text,                                             -- Resend e-posta kimliği
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, kind)
);
create index if not exists email_log_updated_idx on public.email_log (updated_at desc);

alter table public.email_prefs enable row level security;
alter table public.email_log enable row level security;
revoke all on table public.email_prefs from anon, authenticated;
revoke all on table public.email_log from anon, authenticated;

-- 1) İç yardımcı: kime hangi e-posta gitmeli? email_claim ve admin özeti aynı kuralı kullanır --------------------
create or replace function public._email_due(p_kind text, p_user uuid default null, p_limit integer default 25)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.email_prefs ep on ep.user_id = p.id
  where (p_user is null or p.id = p_user)
    and p.banned_at is null
    and ep.opt_out_at is null
    and u.email is not null
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and not coalesce(u.is_anonymous, false)
    and (u.banned_until is null or u.banned_until < now())
    and case p_kind
      when 'welcome' then p.created_at >= now() - interval '3 days'
      when 'nudge' then p.created_at < now() - interval '24 hours'
        and p.created_at >= now() - interval '7 days'
        and not exists (select 1 from public.projects x where x.owner_id = p.id)
        and exists (select 1 from public.email_log w
                    where w.user_id = p.id and w.kind = 'welcome' and w.status = 'sent'
                      and w.updated_at <= now() - interval '20 hours')
      else false
    end
    -- daha önce gönderilmiş / sırada olanlar hariç; başarısız (1 saat sonra) ve yarıda kalan (30 dk sonra) en fazla 3 deneme
    and not exists (
      select 1 from public.email_log l
      where l.user_id = p.id and l.kind = p_kind
        and not (l.attempts < 3 and l.status = 'failed' and l.updated_at < now() - interval '1 hour')
        and not (l.attempts < 3 and l.status = 'pending' and l.updated_at < now() - interval '30 minutes')
    )
  order by p.created_at
  limit greatest(least(coalesce(p_limit, 25), 1000), 1);
$$;
revoke all on function public._email_due(text, uuid, integer) from public, anon, authenticated;

-- 2) Gönderilecekleri talep et (servis rolü: cron ve giriş sonrası hızlı yol) ----------------------------------------
-- Talep, satırı 'pending'e çeker: aynı anda çalışan iki gönderici aynı kişiye aynı e-postayı gönderemez.
-- p_user: yalnız o kullanıcı (girişten hemen sonra). p_locale: girişin yapıldığı sayfanın dili (tercihi yoksa kaydedilir).
create or replace function public.email_claim(p_kind text, p_limit integer default 25, p_user uuid default null, p_locale text default null)
returns table (log_id bigint, user_id uuid, email text, name text, locale text, token uuid, attempt integer)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_limit integer := greatest(least(coalesce(p_limit, 25), 100), 1);
  v_locale text := case when p_locale in ('tr', 'en') then p_locale end;
  v_ids bigint[];
begin
  if p_kind is null or p_kind not in ('welcome', 'nudge') then
    raise exception 'bad_kind' using errcode = '22023';
  end if;

  if p_user is not null and v_locale is not null and exists (select 1 from public.profiles pr where pr.id = p_user) then
    insert into public.email_prefs as ep (user_id, locale) values (p_user, v_locale)
    on conflict (user_id) do update set locale = excluded.locale, updated_at = now() where ep.locale is null;
  end if;

  with claimed as (
    insert into public.email_log as l (user_id, kind)
    select d.id, p_kind from public._email_due(p_kind, p_user, v_limit) as d(id)
    on conflict (user_id, kind) do update
      set status = 'pending', attempts = l.attempts + 1, error = null, updated_at = now()
      where l.attempts < 3
        and ((l.status = 'failed' and l.updated_at < now() - interval '1 hour')
          or (l.status = 'pending' and l.updated_at < now() - interval '30 minutes'))
    returning l.id
  )
  select array_agg(c.id) into v_ids from claimed c;

  if v_ids is null then
    return;
  end if;

  -- Çıkış anahtarı için tercih satırı; dil: kayıt formunun dili, yoksa OAuth sağlayıcısının bildirdiği dil
  insert into public.email_prefs (user_id, locale)
  select l.user_id,
         case
           when u.raw_user_meta_data ->> 'lang' in ('tr', 'en') then u.raw_user_meta_data ->> 'lang'
           when lower(coalesce(u.raw_user_meta_data ->> 'locale', '')) like 'tr%' then 'tr'
           when coalesce(u.raw_user_meta_data ->> 'locale', '') <> '' then 'en'
         end
  from public.email_log l
  join auth.users u on u.id = l.user_id
  where l.id = any (v_ids)
  on conflict (user_id) do nothing;

  return query
  select l.id, l.user_id, u.email::text,
         nullif(left(split_part(coalesce(nullif(btrim(p.display_name), ''),
                                         nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
                                         nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), ''), ' ', 1), 40), ''),
         coalesce(ep.locale, 'tr'), ep.token, l.attempts
  from public.email_log l
  join auth.users u on u.id = l.user_id
  join public.profiles p on p.id = l.user_id
  join public.email_prefs ep on ep.user_id = l.user_id
  where l.id = any (v_ids)
  order by l.id;
end $$;
revoke all on function public.email_claim(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.email_claim(text, integer, uuid, text) to service_role;

-- 3) Gönderim sonucu (servis rolü) -------------------------------------------------------------------------------------
create or replace function public.email_finish(p_log_id bigint, p_ok boolean, p_provider_id text default null, p_error text default null)
returns void
language sql security definer set search_path = public as $$
  update public.email_log
     set status = case when p_ok then 'sent' else 'failed' end,
         provider_id = left(p_provider_id, 200), error = left(p_error, 500), updated_at = now()
   where id = p_log_id and status = 'pending';
$$;
revoke all on function public.email_finish(bigint, boolean, text, text) from public, anon, authenticated;
grant execute on function public.email_finish(bigint, boolean, text, text) to service_role;

-- 4) Abonelikten çıkış bağlantısı (servis rolü; /api/email/unsubscribe çağırır). p_out = false: geri al ----------------
create or replace function public.email_unsubscribe(p_token uuid, p_out boolean default true)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.email_prefs
     set opt_out_at = case when coalesce(p_out, true) then coalesce(opt_out_at, now()) end, updated_at = now()
   where token = p_token;
  return found;
end $$;
revoke all on function public.email_unsubscribe(uuid, boolean) from public, anon, authenticated;
grant execute on function public.email_unsubscribe(uuid, boolean) to service_role;

-- 5) Test e-postası için çıkış anahtarı (servis rolü): tercih satırını gerekirse oluşturur ------------------------------
create or replace function public.email_token_for(p_user uuid)
returns uuid
language sql security definer set search_path = public as $$
  insert into public.email_prefs as ep (user_id) values (p_user)
  on conflict (user_id) do update set updated_at = ep.updated_at
  returning ep.token;
$$;
revoke all on function public.email_token_for(uuid) from public, anon, authenticated;
grant execute on function public.email_token_for(uuid) to service_role;

-- 6) Hesabım → E-posta tercihleri (oturum açmış kullanıcı). Gönderim geçmişi veri indirmede de kullanılır ----------------
create or replace function public.my_email_prefs()
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null else jsonb_build_object(
    'opt_out', coalesce((select ep.opt_out_at is not null from public.email_prefs ep where ep.user_id = auth.uid()), false),
    'opt_out_at', (select ep.opt_out_at from public.email_prefs ep where ep.user_id = auth.uid()),
    'locale', (select ep.locale from public.email_prefs ep where ep.user_id = auth.uid()),
    'sent', coalesce((select jsonb_agg(jsonb_build_object('kind', l.kind, 'status', l.status, 'at', l.updated_at) order by l.created_at)
                      from public.email_log l where l.user_id = auth.uid()), '[]'::jsonb)
  ) end;
$$;
revoke all on function public.my_email_prefs() from public, anon;
grant execute on function public.my_email_prefs() to authenticated;

-- p_opt_out null: değiştirme. p_locale null: değiştirme.
create or replace function public.set_my_email_prefs(p_opt_out boolean, p_locale text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if p_locale is not null and p_locale not in ('tr', 'en') then raise exception 'bad_locale' using errcode = '22023'; end if;
  insert into public.email_prefs as ep (user_id, locale, opt_out_at)
  values (v_uid, p_locale, case when p_opt_out then now() end)
  on conflict (user_id) do update
    set opt_out_at = case when p_opt_out is null then ep.opt_out_at when p_opt_out then coalesce(ep.opt_out_at, now()) end,
        locale = coalesce(p_locale, ep.locale),
        updated_at = now();
end $$;
revoke all on function public.set_my_email_prefs(boolean, text) from public, anon;
grant execute on function public.set_my_email_prefs(boolean, text) to authenticated;

-- 7) Admin → E-postalar (is_admin() ile süzülür: admin olmayana boş) -----------------------------------------------------
create or replace function public.admin_email_overview(p_days integer default 30)
returns table (kind text, status text, n integer)
language sql stable security definer set search_path = public as $$
  select l.kind,
         case when l.status = 'pending' and l.updated_at < now() - interval '30 minutes' then 'stuck' else l.status end,
         count(*)::int
  from public.email_log l
  where public.is_admin()
    and l.created_at >= now() - (greatest(least(coalesce(p_days, 30), 3650), 1) * interval '1 day')
  group by 1, 2
  union all
  select 'optout', 'total', count(*)::int
  from public.email_prefs ep
  where ep.opt_out_at is not null
  having public.is_admin();
$$;
revoke all on function public.admin_email_overview(integer) from public, anon;
grant execute on function public.admin_email_overview(integer) to authenticated;

create or replace function public.admin_email_recent(p_limit integer default 50)
returns table (id bigint, kind text, status text, attempts integer, error text, created_at timestamptz, updated_at timestamptz,
               user_id uuid, username text, email text, locale text, opted_out boolean)
language sql stable security definer set search_path = public as $$
  select l.id, l.kind, l.status, l.attempts, l.error, l.created_at, l.updated_at,
         l.user_id, p.username, p.email, ep.locale, ep.opt_out_at is not null
  from public.email_log l
  join public.profiles p on p.id = l.user_id
  left join public.email_prefs ep on ep.user_id = l.user_id
  where public.is_admin()
  order by l.updated_at desc
  limit greatest(least(coalesce(p_limit, 50), 200), 1);
$$;
revoke all on function public.admin_email_recent(integer) from public, anon;
grant execute on function public.admin_email_recent(integer) to authenticated;

-- Şu an sırada bekleyen (bir sonraki cron çalışmasında gidecek) e-posta sayısı
create or replace function public.admin_email_due()
returns table (kind text, n integer)
language sql stable security definer set search_path = public as $$
  select k.kind, (select count(*)::int from public._email_due(k.kind, null, 1000))
  from (values ('welcome'), ('nudge')) as k(kind)
  where public.is_admin();
$$;
revoke all on function public.admin_email_due() from public, anon;
grant execute on function public.admin_email_due() to authenticated;

-- Kontrol (tek satır, hepsi true olmalı):
-- select not has_function_privilege('authenticated', 'public.email_claim(text, integer, uuid, text)', 'execute') as claim_private,
--        has_function_privilege('service_role', 'public.email_claim(text, integer, uuid, text)', 'execute') as claim_service,
--        not has_function_privilege('anon', 'public.my_email_prefs()', 'execute') as prefs_anon_blocked,
--        has_function_privilege('authenticated', 'public.set_my_email_prefs(boolean, text)', 'execute') as prefs_auth;
