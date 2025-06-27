-- Crear tabla documents
CREATE TABLE IF NOT EXISTS documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  source TEXT NOT NULL,
  doc_type TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Crear tabla chunks
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_order INTEGER,
  article_number TEXT,
  char_count INTEGER,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Crear tabla embeddings
CREATE TABLE IF NOT EXISTS embeddings (
  vector_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  chunk_id UUID REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  embedding TEXT NOT NULL,
  embeddings_order INTEGER,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Crear tabla chat_history
CREATE TABLE IF NOT EXISTS chat_history (
  chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  documents_used UUID[],
  session_id TEXT DEFAULT 'default-session',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para chat_history
CREATE INDEX IF NOT EXISTS chat_history_session_id_idx ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS chat_history_created_at_idx ON chat_history(created_at); 