-- Crear tabla de documentos
create table if not exists documents (
  document_id uuid primary key,
  source text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear tabla de secciones
create table if not exists sections (
  section_id uuid primary key,
  document_id uuid references documents(document_id) on delete cascade,
  parent_section_id uuid references sections(section_id) on delete set null,
  section_type text not null,
  section_number text not null,
  content_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear tabla de chunks
create table if not exists chunks (
  chunk_id uuid primary key,
  section_id uuid references sections(section_id) on delete cascade,
  chunk_text text not null,
  char_count integer not null,
  start_page integer,
  end_page integer,
  vector_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear tabla de embeddings
create table if not exists embeddings (
  vector_id uuid primary key,
  chunk_id uuid references chunks(chunk_id) on delete cascade,
  embedding vector(1536), -- Dimensión para text-embedding-ada-002
  embeddings_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear índices para búsqueda vectorial
create index if not exists embeddings_vector_idx on embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100); 