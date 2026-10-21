-- Fotos de ventas anteriores: la revisión del correo busca una vez, en Gmail,
-- la foto del anuncio de las ventas de Vinted y Wallapop que no la tienen.
-- Esta marca guarda cuándo terminó esa búsqueda para no repetirla.
alter table public.email_integration
  add column if not exists photos_backfill_at timestamptz;
