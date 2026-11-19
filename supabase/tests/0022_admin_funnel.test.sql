-- Prompt.Monster — 0022 admin huni davranış testi (geri alınan DO bloğu; yalnız okur, yine de sonda geri alınır).
-- Nasıl: Supabase SQL Editor → yeni sorgu → bu dosyanın tamamı → Run. Sonuç kırmızı "ERROR: P0001: TEST_RESULTS" altında.
-- Kullanıcılar: bir admin (profiles.role = 'admin') ve bir admin olmayan profil, dinamik seçilir.
--
-- Beklenen:
--   01 non-admin: funnel=0 daily=0 leak=f   (0025 öncesi funnel=1: değerleri sıfır olan tek toplam satırı)
--   02 admin: total row=1; groups sum = total signups -> t
--   03 admin: every step <= signups -> t; saved/generated/... non-negative -> t
--   04 admin: daily rows (30) = 30; daily(7) = 7; daily(9999) capped = 365
--   05 admin: invalid tz -> error (time zone ... not recognized)
--   06 privileges: anon_funnel=f anon_daily=f auth_funnel=t
do $test$
declare
  adm uuid; usr uuid;
  r text[] := '{}';
  tot record; s_sum int; ok_steps boolean;
begin
  select id into adm from public.profiles where role = 'admin' order by created_at limit 1;
  select id into usr from public.profiles where role is distinct from 'admin' order by created_at limit 1;
  if adm is null or usr is null then raise exception 'TEST_SETUP: bir admin ve bir admin olmayan profil gerekli'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', usr, 'role', 'authenticated')::text, true);
  r := array_append(r, format('01 non-admin: funnel=%s daily=%s leak=%s', (select count(*) from public.admin_funnel(30)), (select count(*) from public.admin_activity_daily(30)),
      (select coalesce(bool_or(signups > 0 or saved > 0 or generated > 0 or used_ai > 0 or shared > 0 or pro_interest > 0 or paid > 0
                               or source is not null), false) from public.admin_funnel(365))));

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select * into tot from public.admin_funnel(365) where is_total;
  select coalesce(sum(signups), 0) into s_sum from public.admin_funnel(365) where not is_total;
  r := array_append(r, format('02 admin: total row=%s; groups sum = total signups -> %s',
      (select count(*) from public.admin_funnel(365) where is_total), s_sum = coalesce(tot.signups, 0)));
  select bool_and(saved <= signups and generated <= signups and used_ai <= signups and shared <= signups and pro_interest <= signups and paid <= signups
                  and saved >= 0 and generated >= 0 and used_ai >= 0 and shared >= 0 and pro_interest >= 0 and paid >= 0)
    into ok_steps from public.admin_funnel(365);
  r := array_append(r, format('03 admin: every step <= signups and non-negative -> %s (total signups=%s generated=%s median_h=%s)',
      coalesce(ok_steps, true), coalesce(tot.signups, 0), coalesce(tot.generated, 0), coalesce(tot.gen_hours_median::text, 'null')));
  r := array_append(r, format('04 admin: daily rows (30) = %s; daily(7) = %s; daily(9999) capped = %s',
      (select count(*) from public.admin_activity_daily(30)), (select count(*) from public.admin_activity_daily(7)), (select count(*) from public.admin_activity_daily(9999))));
  begin perform * from public.admin_activity_daily(7, 'Not/AZone'); r := array_append(r, 'FAIL 05 invalid tz accepted');
  exception when others then r := array_append(r, '05 admin: invalid tz -> ' || sqlerrm); end;

  r := array_append(r, format('06 privileges: anon_funnel=%s anon_daily=%s auth_funnel=%s',
      has_function_privilege('anon', 'public.admin_funnel(integer)', 'execute'),
      has_function_privilege('anon', 'public.admin_activity_daily(integer, text)', 'execute'),
      has_function_privilege('authenticated', 'public.admin_funnel(integer)', 'execute')));

  raise exception 'TEST_RESULTS%', E'\n' || array_to_string(r, E'\n');
end $test$;
