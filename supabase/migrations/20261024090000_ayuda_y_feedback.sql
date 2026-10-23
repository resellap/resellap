-- Ayuda, soporte y feedback (24/10/2026).
--
-- · feedback: ideas, fallos y comentarios que manda cada usuario (con una
--   captura opcional). Los lee el administrador de la plataforma en /admin.
-- · support_requests: dudas escritas en el centro de ayuda. Primero responde
--   la IA; si no lo resuelve, queda abierta para que responda una persona.
--
-- Nadie lee ni escribe estas tablas directamente: solo a través de las
-- funciones de abajo, que comprueban quién llama. Un espacio en solo lectura
-- también puede pedir ayuda (por ejemplo, con la suscripción).

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  user_email text,
  kind text not null check (kind in ('idea', 'fallo', 'otro')),
  message text not null check (char_length(message) between 3 and 4000),
  page text check (char_length(page) <= 300),
  screenshot_path text,
  status text not null default 'nuevo' check (status in ('nuevo', 'visto', 'resuelto')),
  created_at timestamptz not null default now(),
  -- La captura solo puede estar en la carpeta de su espacio y de su autor
  constraint feedback_shot_own_folder check (
    screenshot_path is null
    or (split_part(screenshot_path, '/', 1) = organization_id::text and split_part(screenshot_path, '/', 2) = user_id::text)
  )
);
create index if not exists feedback_status_idx on public.feedback (status, created_at desc);
create index if not exists feedback_user_day_idx on public.feedback (user_id, created_at desc);

create table if not exists public.support_requests (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  user_email text,
  question text not null check (char_length(question) between 3 and 2000),
  page text check (char_length(page) <= 300),
  ai_answer text check (char_length(ai_answer) <= 6000),
  -- ia: respondida por la IA, sin valorar · resuelto: le sirvió
  -- abierto: necesita una persona · respondido: ya contestada por soporte
  status text not null default 'ia' check (status in ('ia', 'resuelto', 'abierto', 'respondido')),
  reply text check (char_length(reply) <= 6000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists support_requests_status_idx on public.support_requests (status, created_at desc);
create index if not exists support_requests_user_idx on public.support_requests (user_id, created_at desc);

alter table public.feedback enable row level security;
alter table public.support_requests enable row level security;
revoke all on table public.feedback, public.support_requests from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Usuario: enviar feedback y pedir ayuda
-- ---------------------------------------------------------------------
create or replace function private.require_member()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.current_org_id();
begin
  if auth.uid() is null or v_org is null or not public.is_active_user() then
    raise exception 'Tu sesión ha caducado. Vuelve a entrar.' using errcode = '42501';
  end if;
  return v_org;
end;
$$;

create or replace function public.submit_feedback(p_kind text, p_message text, p_page text default null, p_screenshot text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := private.require_member();
  v_id bigint;
begin
  if (select count(*) from public.feedback where user_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Has enviado mucho feedback hoy. Gracias: inténtalo de nuevo mañana.' using errcode = 'P0001';
  end if;
  if p_kind not in ('idea', 'fallo', 'otro') then
    raise exception 'Elige el tipo de mensaje.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_message, ''))) < 3 then
    raise exception 'Escribe tu mensaje.' using errcode = 'P0001';
  end if;
  insert into public.feedback (organization_id, user_id, user_email, kind, message, page, screenshot_path)
  values (v_org, auth.uid(), (select p.email from public.profiles p where p.id = auth.uid()), p_kind,
          left(btrim(p_message), 4000), left(nullif(btrim(p_page), ''), 300), nullif(p_screenshot, ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Nueva duda. p_direct = true: va directa a soporte (sin IA).
create or replace function public.support_ask(p_question text, p_page text default null, p_direct boolean default false)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := private.require_member();
  v_id bigint;
begin
  if (select count(*) from public.support_requests where user_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Has hecho muchas consultas hoy. Inténtalo de nuevo mañana.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_question, ''))) < 3 then
    raise exception 'Escribe tu pregunta.' using errcode = 'P0001';
  end if;
  insert into public.support_requests (organization_id, user_id, user_email, question, page, status)
  values (v_org, auth.uid(), (select p.email from public.profiles p where p.id = auth.uid()),
          left(btrim(p_question), 2000), left(nullif(btrim(p_page), ''), 300), case when p_direct then 'abierto' else 'ia' end)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.support_set_ai_answer(p_id bigint, p_answer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.require_member();
  update public.support_requests
     set ai_answer = left(p_answer, 6000)
   where id = p_id and user_id = auth.uid() and status = 'ia' and ai_answer is null;
end;
$$;

-- ¿Le ha servido la respuesta de la IA? Si no, queda abierta para soporte.
-- Devuelve true si ha cambiado algo (para avisar a soporte una sola vez).
create or replace function public.support_resolve(p_id bigint, p_resolved boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.require_member();
  update public.support_requests
     set status = case when p_resolved then 'resuelto' else 'abierto' end
   where id = p_id and user_id = auth.uid() and status = 'ia';
  return found;
end;
$$;

create or replace function public.my_support_requests()
returns table (id bigint, question text, status text, reply text, replied_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.question, r.status, r.reply, r.replied_at, r.created_at
    from public.support_requests r
   where r.user_id = auth.uid() and r.organization_id = public.current_org_id() and r.status in ('abierto', 'respondido')
   order by r.created_at desc
   limit 20
$$;

-- ---------------------------------------------------------------------
-- Administrador de la plataforma
-- ---------------------------------------------------------------------
create or replace function public.platform_feedback()
returns table (id bigint, organization_id uuid, organization_name text, user_email text, kind text, message text,
               page text, screenshot_path text, status text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  return query
  select f.id, f.organization_id, o.name, f.user_email, f.kind, f.message, f.page, f.screenshot_path, f.status, f.created_at
    from public.feedback f join public.organizations o on o.id = f.organization_id
   order by (f.status = 'nuevo') desc, f.created_at desc
   limit 300;
end;
$$;

create or replace function public.platform_set_feedback_status(p_id bigint, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if p_status not in ('nuevo', 'visto', 'resuelto') then
    raise exception 'Estado no válido.' using errcode = 'P0001';
  end if;
  update public.feedback set status = p_status where id = p_id;
end;
$$;

create or replace function public.platform_support_requests()
returns table (id bigint, organization_name text, user_email text, question text, page text, ai_answer text,
               status text, reply text, replied_at timestamptz, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  return query
  select r.id, o.name, r.user_email, r.question, r.page, r.ai_answer, r.status, r.reply, r.replied_at, r.created_at
    from public.support_requests r join public.organizations o on o.id = r.organization_id
   order by (r.status = 'abierto') desc, r.created_at desc
   limit 300;
end;
$$;

-- Responde una consulta. Devuelve el correo de quien preguntó y su pregunta.
create or replace function public.platform_reply_support(p_id bigint, p_reply text)
returns table (user_email text, question text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_reply, ''))) < 2 then
    raise exception 'Escribe la respuesta.' using errcode = 'P0001';
  end if;
  return query
  update public.support_requests r
     set reply = left(btrim(p_reply), 6000), status = 'respondido', replied_at = now()
   where r.id = p_id
  returning r.user_email, r.question;
end;
$$;

-- Avisos para el panel: cuántos mensajes esperan
create or replace function public.platform_inbox_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'feedback', (select count(*) from public.feedback where status = 'nuevo'),
    'support', (select count(*) from public.support_requests where status = 'abierto'));
end;
$$;

revoke execute on function private.require_member() from public, anon;
revoke execute on function
  public.submit_feedback(text, text, text, text), public.support_ask(text, text, boolean), public.support_set_ai_answer(bigint, text),
  public.support_resolve(bigint, boolean), public.my_support_requests(), public.platform_feedback(),
  public.platform_set_feedback_status(bigint, text), public.platform_support_requests(), public.platform_reply_support(bigint, text),
  public.platform_inbox_counts()
from public, anon;
grant execute on function
  public.submit_feedback(text, text, text, text), public.support_ask(text, text, boolean), public.support_set_ai_answer(bigint, text),
  public.support_resolve(bigint, boolean), public.my_support_requests(), public.platform_feedback(),
  public.platform_set_feedback_status(bigint, text), public.platform_support_requests(), public.platform_reply_support(bigint, text),
  public.platform_inbox_counts()
to authenticated;

-- ---------------------------------------------------------------------
-- Capturas del feedback: almacén privado, carpeta <espacio>/<usuario>/.
-- Cada usuario solo puede subir a su carpeta; nadie puede leerlas desde la
-- app (las abre el panel de administración con un enlace temporal).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback', 'feedback', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "feedback_insert_own" on storage.objects;
create policy "feedback_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'feedback'
    and split_part(name, '/', 1) = (select public.current_org_id())::text
    and split_part(name, '/', 2) = (select auth.uid())::text
  );
