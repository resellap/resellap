-- La búsqueda de fotos de ventas anteriores se reparte en varias revisiones
-- (Gmail limita la velocidad): aquí se guarda hasta qué correo se ha llegado.
alter table public.email_integration
  add column if not exists photos_backfill_cursor bigint;
