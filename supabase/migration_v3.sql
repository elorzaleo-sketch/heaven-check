-- ============================================================
-- HEAVEN CHECK — migración v3
-- Arregla el pedido de demo: un visitante (rol "anon") no tiene permiso de
-- LEER la tabla (a propósito, para proteger los datos de los demás), pero
-- en Postgres para poder ACTUALIZAR una fila primero hace falta poder
-- "verla" — por eso el update de la demo no encontraba la fila y no
-- guardaba nada (aunque no tirara error).
--
-- La solución: una función especial que sí puede tocar la fila puntual
-- (sin necesidad de leer el resto de la tabla), que el juego llama en vez
-- de hacer un update directo.
-- Pegar y ejecutar completo en: Supabase Dashboard → SQL Editor
-- ============================================================

create or replace function public.marcar_demo(p_lead_id uuid, p_telefono text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leads
  set quiere_demo = true,
      demo_contacto = p_telefono,
      demo_requested_at = now()
  where id = p_lead_id;
end;
$$;

grant execute on function public.marcar_demo(uuid, text) to anon;
