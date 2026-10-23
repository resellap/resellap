-- Auditoría (23/10/2026): endurecimiento sin cambios de funcionalidad.
--
-- 1. Funciones auxiliares sin search_path fijo: se fija a vacío (solo usan
--    funciones del sistema), así nadie puede «colarles» otra función.
-- 2. La etiqueta de envío de una venta solo puede estar en la carpeta de esa
--    venta, y la foto del anuncio en la carpeta de su organización. Antes
--    update_sale aceptaba cualquier ruta (los archivos seguían protegidos por
--    los permisos del almacén, pero el servidor podía llegar a leerla).
-- 3. Se quita un disparador que no hacía nada (protect_last_admin: la
--    protección del último administrador vive ahora en las funciones de
--    miembros).
-- 4. current_org_id() no la necesita nadie sin sesión.

alter function private.all_permissions() set search_path = '';
alter function private.role_default_permissions(text) set search_path = '';
alter function private.platform_label(text) set search_path = '';
alter function private.envio_state(text, text, timestamptz) set search_path = '';
alter function private.uuid_or_null(jsonb, text) set search_path = '';
alter function private.int_or_null(jsonb, text, text) set search_path = '';
alter function private.txt(jsonb, text) set search_path = '';
alter function private.num_or_null(jsonb, text, text) set search_path = '';
alter function private.date_or_null(jsonb, text, text) set search_path = '';
alter function private.org_tables() set search_path = '';
alter function private.token_hash(text) set search_path = '';

alter table public.sales drop constraint if exists sales_label_path_own_folder;
alter table public.sales add constraint sales_label_path_own_folder
  check (shipping_label_path is null or shipping_label_path like id::text || '/%');
alter table public.sales drop constraint if exists sales_image_path_own_org;
alter table public.sales add constraint sales_image_path_own_org
  check (image_path is null or split_part(image_path, '/', 1) = organization_id::text);

drop trigger if exists profiles_protect_last_admin on public.profiles;
drop function if exists public.protect_last_admin();

revoke execute on function public.current_org_id() from public, anon;
