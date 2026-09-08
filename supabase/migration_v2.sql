-- ============================================================
-- HEAVEN CHECK — migración v2
-- Correr UNA sola vez en el proyecto de Supabase que ya tenías creado
-- (agrega teléfono del lead y asignación a Pablo/Graciela).
-- Pegar y ejecutar completo en: Supabase Dashboard → SQL Editor
-- ============================================================

alter table public.leads add column if not exists telefono text;
alter table public.leads add column if not exists asignado_a text;

-- El panel de admin corre como usuario autenticado (no anon), así que
-- necesita su propia policy de UPDATE para poder asignar cada lead.
drop policy if exists "admin autenticado puede actualizar" on public.leads;
create policy "admin autenticado puede actualizar"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

-- Permite borrar leads de prueba desde el panel (uno por uno).
drop policy if exists "admin autenticado puede eliminar" on public.leads;
create policy "admin autenticado puede eliminar"
  on public.leads for delete
  to authenticated
  using (true);
