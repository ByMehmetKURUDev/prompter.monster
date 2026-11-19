-- Prompt.Monster — 0020 takım kütüphanesi davranış testi (geri alınan DO bloğu).
-- Nasıl: Supabase SQL Editor → yeni sorgu → bu dosyanın tamamı → Run. HİÇBİR ŞEY KALICI OLMAZ: blok sonda bilerek
-- hata fırlatır, yaptığı her şey geri alınır. Sonuç kırmızı "ERROR: P0001: TEST_RESULTS" mesajının altında satır satır görünür.
-- Kullanıcılar: banlı olmayan ve takımda olmayan en eski 3 profil (A sahip, B üye, C dışarıdan kişi); ID'leri dosyada tutulmaz.
-- auth.uid() taklidi: set_config('request.jwt.claims', {"sub": …}, true) — 0017 testlerindeki desen.
--
-- Beklenen (19 Kas 2026, canlıda 18/18 geçti):
--   00 users picked: 3
--   01 share while pending -> team_inactive
--   02 A shares: t; my_shared=1; updated_at unchanged=t
--   02b share twice idempotent: t rows=1
--   03 B library: rows=1 name=A Proje owner_set=(kullanıcı adına göre t/f) is_mine=f versions=0 latest=null
--   04 B team_project: rows=1 state_name=A Proje is_mine=f
--   05 B unshares A project -> project_not_found
--   06 B shares own: t; library rows=2; mine flagged=1
--   07 outsider C: library=0 team_project=0
--   08 C shares A project -> project_not_found
--   08b C (no team) shares own -> no_team
--   09 injected non-member row hidden: library=2 team_project=0
--   10 pending team: B library=0 team_project=0
--   11 B left: B share rows=0; A share rows=1
--   12 B after leaving: library=0 team_project=0
--   13 A unshares: f; rows=0
--   14 project delete cascades: rows=0
--   15 team delete cascades: rows=0
do $test$
declare
  u uuid[]; a uuid; b uuid; c uuid;
  r text[] := '{}';
  t uuid; k text; pa uuid; pb uuid; pc uuid; ok boolean; rec record; upd0 timestamptz;
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
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  t := public.create_team('Lib Test');
  select invite_token into k from public.create_team_invite(null, 'member');
  insert into public.projects (owner_id, name, project_type, state) values (a, 'A Proje', 'saas-dash', '{"name":"A Proje","step":1}'::jsonb) returning id, updated_at into pa, upd0;
  begin perform public.set_project_team_share(pa, true); r := array_append(r, 'FAIL 01 pending team share allowed');
  exception when others then r := array_append(r, '01 share while pending -> ' || sqlerrm); end;
  update public.teams set status = 'active' where id = t;
  ok := public.set_project_team_share(pa, true);
  r := array_append(r, format('02 A shares: %s; my_shared=%s; updated_at unchanged=%s', ok,
      (select count(*) from public.my_team_shared_projects() where project_id = pa), (select updated_at = upd0 from public.projects where id = pa)));
  ok := public.set_project_team_share(pa, true);
  r := array_append(r, format('02b share twice idempotent: %s rows=%s', ok, (select count(*) from public.team_projects where project_id = pa)));

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.accept_team_invite(k);
  select * into rec from public.team_library() limit 1;
  r := array_append(r, format('03 B library: rows=%s name=%s owner_set=%s is_mine=%s versions=%s latest=%s',
      (select count(*) from public.team_library()), rec.name, rec.owner_username is not null, rec.is_mine, rec.versions, coalesce(rec.latest_version::text, 'null')));
  r := array_append(r, format('04 B team_project: rows=%s state_name=%s is_mine=%s', (select count(*) from public.team_project(pa)),
      (select state->>'name' from public.team_project(pa)), (select is_mine from public.team_project(pa))));
  begin perform public.set_project_team_share(pa, false); r := array_append(r, 'FAIL 05 non-owner unshare');
  exception when others then r := array_append(r, '05 B unshares A project -> ' || sqlerrm); end;
  insert into public.projects (owner_id, name, project_type, state) values (b, 'B Proje', 'mobile', '{"name":"B Proje"}'::jsonb) returning id into pb;
  ok := public.set_project_team_share(pb, true);
  r := array_append(r, format('06 B shares own: %s; library rows=%s; mine flagged=%s', ok, (select count(*) from public.team_library()),
      (select count(*) from public.team_library() where is_mine)));

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  r := array_append(r, format('07 outsider C: library=%s team_project=%s', (select count(*) from public.team_library()), (select count(*) from public.team_project(pa))));
  begin perform public.set_project_team_share(pa, true); r := array_append(r, 'FAIL 08');
  exception when others then r := array_append(r, '08 C shares A project -> ' || sqlerrm); end;
  insert into public.projects (owner_id, name, project_type, state) values (c, 'C Proje', 'mobile', '{}'::jsonb) returning id into pc;
  begin perform public.set_project_team_share(pc, true); r := array_append(r, 'FAIL 08b');
  exception when others then r := array_append(r, '08b C (no team) shares own -> ' || sqlerrm); end;
  insert into public.team_projects (project_id, team_id, shared_by) values (pc, t, c);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  r := array_append(r, format('09 injected non-member row hidden: library=%s team_project=%s', (select count(*) from public.team_library()), (select count(*) from public.team_project(pc))));

  update public.teams set status = 'pending' where id = t;
  r := array_append(r, format('10 pending team: B library=%s team_project=%s', (select count(*) from public.team_library()), (select count(*) from public.team_project(pa))));
  update public.teams set status = 'active' where id = t;

  perform public.leave_team();
  r := array_append(r, format('11 B left: B share rows=%s; A share rows=%s', (select count(*) from public.team_projects where project_id = pb), (select count(*) from public.team_projects where project_id = pa)));
  r := array_append(r, format('12 B after leaving: library=%s team_project=%s', (select count(*) from public.team_library()), (select count(*) from public.team_project(pa))));

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  ok := public.set_project_team_share(pa, false);
  r := array_append(r, format('13 A unshares: %s; rows=%s', ok, (select count(*) from public.team_projects where project_id = pa)));
  ok := public.set_project_team_share(pa, true);
  delete from public.projects where id = pa;
  r := array_append(r, format('14 project delete cascades: rows=%s', (select count(*) from public.team_projects where project_id = pa)));
  insert into public.projects (owner_id, name, project_type, state) values (a, 'A2', 'saas-dash', '{}'::jsonb) returning id into pa;
  ok := public.set_project_team_share(pa, true);
  update public.teams set status = 'pending' where id = t;
  perform public.delete_team();
  r := array_append(r, format('15 team delete cascades: rows=%s', (select count(*) from public.team_projects where project_id = pa)));

  raise exception 'TEST_RESULTS%', E'\n' || array_to_string(r, E'\n');
end $test$;
