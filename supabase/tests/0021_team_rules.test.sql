-- Prompt.Monster — 0021 takım kuralları davranış testi (geri alınan DO bloğu).
-- Nasıl: Supabase SQL Editor → yeni sorgu → bu dosyanın tamamı → Run. HİÇBİR ŞEY KALICI OLMAZ: blok sonda bilerek
-- hata fırlatır, yaptığı her şey geri alınır. Sonuç kırmızı "ERROR: P0001: TEST_RESULTS" mesajının altında satır satır görünür.
-- Kullanıcılar: banlı olmayan ve takımda olmayan en eski 3 profil (A sahip, B üye→yönetici, C dışarıdan kişi).
--
-- Beklenen:
--   00 users picked: 3
--   01 A saves rules (pending team): ok; my_team_rules stack=Next.js can_edit=t enabled=t status=pending updated_by_set=t
--   02 team_rules_for(A) while pending: 0
--   03 B (member) reads: rows=1 code=TS strict can_edit=f
--   04 B (member) writes -> forbidden
--   05 B as admin writes: ok; voice=Samimi
--   06 C (outsider): rows=0
--   07 C writes -> no_team
--   08 too long -> too_long
--   09 active team: team_rules_for(A)=1 team_rules_for(B)=1 team_rules_for(C)=0
--   10 disabled: team_rules_for(A)=0
--   11 enabled but empty: team_rules_for(A)=0
--   12 canceled team write -> team_canceled
--   13 privileges: anon_read=f auth_read=t auth_api_fn=f service_api_fn=t
do $test$
declare
  u uuid[]; a uuid; b uuid; c uuid;
  r text[] := '{}';
  t uuid; k text; rec record;
begin
  select array_agg(s.id order by s.created_at) into u from (
    select p.id, p.created_at from public.profiles p
    where p.banned_at is null and not exists (select 1 from public.team_members m where m.user_id = p.id)
    order by p.created_at limit 3) s;
  if coalesce(array_length(u, 1), 0) < 3 then
    raise exception 'TEST_SETUP: banlı olmayan ve takımda olmayan 3 profil gerekli';
  end if;
  a := u[1]; b := u[2]; c := u[3];
  r := array_append(r, format('00 users picked: %s', array_length(u, 1)));

  -- A: takım kur, B'yi davet et, kuralları beklemede kaydet
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  t := public.create_team('Rules Test');
  select invite_token into k from public.create_team_invite(null, 'member');
  perform public.set_team_rules('Next.js', 'TS strict', 'Kurumsal', true);
  select * into rec from public.my_team_rules();
  r := array_append(r, format('01 A saves rules (pending team): ok; my_team_rules stack=%s can_edit=%s enabled=%s status=%s updated_by_set=%s',
      rec.stack, rec.can_edit, rec.enabled, rec.team_status, rec.updated_at is not null));
  r := array_append(r, format('02 team_rules_for(A) while pending: %s', (select count(*) from public.team_rules_for(a))));

  -- B: katıl, oku, yazmayı dene
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.accept_team_invite(k);
  select * into rec from public.my_team_rules();
  r := array_append(r, format('03 B (member) reads: rows=%s code=%s can_edit=%s', (select count(*) from public.my_team_rules()), rec.code, rec.can_edit));
  begin perform public.set_team_rules('x', 'y', 'z', true); r := array_append(r, 'FAIL 04 member could write');
  exception when others then r := array_append(r, '04 B (member) writes -> ' || sqlerrm); end;

  -- A, B'yi yönetici yapar; B yazar
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.set_team_member_role(b, 'admin');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.set_team_rules('Next.js', 'TS strict', 'Samimi', true);
  r := array_append(r, format('05 B as admin writes: ok; voice=%s', (select voice from public.my_team_rules())));

  -- C: dışarıdan
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  r := array_append(r, format('06 C (outsider): rows=%s', (select count(*) from public.my_team_rules())));
  begin perform public.set_team_rules('x', 'y', 'z', true); r := array_append(r, 'FAIL 07');
  exception when others then r := array_append(r, '07 C writes -> ' || sqlerrm); end;

  -- uzunluk sınırı
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin perform public.set_team_rules(repeat('x', 1501), '', '', true); r := array_append(r, 'FAIL 08');
  exception when others then r := array_append(r, '08 too long -> ' || sqlerrm); end;

  -- aktif takım → API kuralları görür
  update public.teams set status = 'active' where id = t;
  r := array_append(r, format('09 active team: team_rules_for(A)=%s team_rules_for(B)=%s team_rules_for(C)=%s',
      (select count(*) from public.team_rules_for(a)), (select count(*) from public.team_rules_for(b)), (select count(*) from public.team_rules_for(c))));
  perform public.set_team_rules('Next.js', 'TS strict', 'Samimi', false);
  r := array_append(r, format('10 disabled: team_rules_for(A)=%s', (select count(*) from public.team_rules_for(a))));
  perform public.set_team_rules('', '', '', true);
  r := array_append(r, format('11 enabled but empty: team_rules_for(A)=%s', (select count(*) from public.team_rules_for(a))));

  -- iptal edilen takım
  update public.teams set status = 'canceled' where id = t;
  begin perform public.set_team_rules('x', '', '', true); r := array_append(r, 'FAIL 12');
  exception when others then r := array_append(r, '12 canceled team write -> ' || sqlerrm); end;

  r := array_append(r, format('13 privileges: anon_read=%s auth_read=%s auth_api_fn=%s service_api_fn=%s',
      has_function_privilege('anon', 'public.my_team_rules()', 'execute'),
      has_function_privilege('authenticated', 'public.my_team_rules()', 'execute'),
      has_function_privilege('authenticated', 'public.team_rules_for(uuid)', 'execute'),
      has_function_privilege('service_role', 'public.team_rules_for(uuid)', 'execute')));

  raise exception 'TEST_RESULTS%', E'\n' || array_to_string(r, E'\n');
end $test$;
