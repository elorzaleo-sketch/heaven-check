-- ============================================================
-- HEAVEN CHECK — esquema de Supabase
-- Pegar y ejecutar completo en: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- datos personales (pantalla 1)
  nombre text not null,
  empresa text not null,
  email text,

  -- respuestas crudas del cuestionario, por id de pregunta
  answers jsonb not null,

  -- puntajes por eje: { I, A, V, C }
  scores jsonb not null,

  -- resultado calculado
  outcome_id text not null,          -- 'preparada' | 'integracion' | 'control'
  outcome_nombre text not null,
  opportunities jsonb not null,      -- array de strings mostradas

  -- solicitud de demo (se completa después, si la piden)
  quiere_demo boolean not null default false,
  demo_contacto text,
  demo_requested_at timestamptz
);

-- Índices útiles para el panel de admin
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_outcome_idx on public.leads (outcome_id);
create index if not exists leads_quiere_demo_idx on public.leads (quiere_demo);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.leads enable row level security;

-- Cualquiera (el stand, sin login) puede crear su propio registro al
-- terminar el juego.
create policy "anon puede insertar su lead"
  on public.leads for insert
  to anon
  with check (true);

-- Cualquiera puede actualizar (solo lo usa la propia app para marcar
-- "quiere_demo" en su propio registro, identificado por el uuid que
-- generó el navegador — no es información sensible ni de terceros).
create policy "anon puede actualizar su lead"
  on public.leads for update
  to anon
  using (true)
  with check (true);

-- Nadie anónimo puede LEER la tabla completa: eso es lo que protege los
-- datos de todos los demás visitantes del stand. Solo un usuario
-- autenticado (el panel de admin, con su usuario de Supabase Auth)
-- puede leer.
create policy "solo admin autenticado puede leer"
  on public.leads for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- Usuario de admin
-- ------------------------------------------------------------
-- Crear el usuario que va a usar el panel (admin.html) desde:
-- Supabase Dashboard → Authentication → Users → Add user
-- (email + contraseña). No hace falta nada más: la policy de arriba
-- ya permite leer a cualquier usuario autenticado.
