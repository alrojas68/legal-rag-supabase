-- Crear tabla para el historial de chat (sin autenticación de usuarios)
create table if not exists chat_history (
  chat_id uuid primary key default gen_random_uuid(),
  query text not null,
  response text not null,
  documents_used uuid[],
  session_id text default 'default-session',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear índices para mejorar el rendimiento
create index if not exists chat_history_session_id_idx on chat_history(session_id);
create index if not exists chat_history_created_at_idx on chat_history(created_at);

-- No habilitar RLS ya que no hay autenticación de usuarios
-- alter table chat_history enable row level security; 