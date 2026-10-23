-- Espacios nuevos con las listas iniciales en el idioma de quien lo crea
-- (24/10/2026). Lo que ya existe no se toca: cada uno puede renombrar sus
-- listas cuando quiera.
--
-- · Plataformas: Vinted siempre; Wallapop donde funciona (España, Portugal e
--   Italia); eBay en el resto; y la venta en mano con el nombre del idioma.
-- · Transportistas: los habituales de cada país.
-- Es una función nueva (create_organization sigue igual para no romper nada).

create or replace function public.create_organization_localized(p_name text, p_lang text default 'es')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_lang text := case when p_lang in ('es', 'en', 'fr', 'de', 'it', 'pt') then p_lang else 'es' end;
  v_person text;
  v_in_person text := case v_lang
    when 'en' then 'In person' when 'fr' then 'En main propre' when 'de' then 'Persönlich'
    when 'it' then 'Di persona' when 'pt' then 'Em mão' else 'En persona' end;
  v_second text := case when v_lang in ('es', 'pt', 'it') then 'Wallapop' else 'eBay' end;
  v_carriers text[] := case v_lang
    when 'en' then array['Evri', 'Royal Mail', 'InPost', 'DPD', 'Vinted Go']
    when 'fr' then array['Mondial Relay', 'Colissimo', 'Chronopost', 'Relais Colis', 'Vinted Go']
    when 'de' then array['DHL', 'Hermes', 'DPD', 'GLS', 'Vinted Go']
    when 'it' then array['Poste Italiane', 'BRT', 'InPost', 'GLS', 'Vinted Go']
    when 'pt' then array['CTT', 'InPost', 'DPD', 'Vinted Go']
    else array['InPost', 'Seur', 'Correos', 'DHL', 'Vinted Go'] end;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and active) then
    raise exception 'Tienes que iniciar sesión.' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = v_uid and email_confirmed_at is not null) then
    raise exception 'Confirma tu correo electrónico antes de crear tu espacio.';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'El nombre del negocio debe tener entre 2 y 80 caracteres.';
  end if;
  if (select count(*) from public.organizations where created_by = v_uid) >= 3 then
    raise exception 'Has alcanzado el máximo de 3 espacios creados.';
  end if;

  insert into public.organizations (name, created_by) values (v_name, v_uid) returning id into v_org;
  insert into public.memberships (organization_id, user_id, role) values (v_org, v_uid, 'admin');
  insert into public.subscriptions (organization_id, status, trial_ends_at) values (v_org, 'trialing', now() + interval '7 days');
  -- Listas iniciales (cada organización tiene las suyas), en su idioma
  insert into public.platforms (organization_id, name, requires_shipping, sort_order)
  values (v_org, 'Vinted', true, 10), (v_org, v_second, true, 20), (v_org, v_in_person, false, 30);
  insert into public.carriers (organization_id, name)
  select v_org, c from unnest(v_carriers) c;
  insert into public.email_integration (organization_id) values (v_org);
  select coalesce(nullif(full_name, ''), split_part(email, '@', 1)) into v_person from public.profiles where id = v_uid;
  insert into public.responsibles (organization_id, name, profile_id, is_partner) values (v_org, v_person, v_uid, true);
  update public.profiles set active_org_id = v_org where id = v_uid;
  insert into public.audit_log (organization_id, user_id, user_email, action, entity, entity_id, summary)
  values (v_org, v_uid, public.audit_actor_email(), 'crear_organizacion', 'organizations', v_org::text, 'Espacio creado: ' || v_name);
  return v_org;
end;
$$;

grant execute on function public.create_organization_localized(text, text) to authenticated;
