-- Script para optimizar la estructura de la base de datos
-- Ejecutar después de limpiar la base de datos

-- 1. Crear una estructura simplificada y optimizada
DROP TABLE IF EXISTS embeddings CASCADE;
DROP TABLE IF EXISTS chunks CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- 2. Crear tabla de documentos simplificada
CREATE TABLE documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de chunks simplificada (sin sections)
CREATE TABLE chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  chunk_order INTEGER NOT NULL, -- Para mantener el orden de los chunks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla de embeddings optimizada
CREATE TABLE embeddings (
  vector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  embedding VECTOR(768) NOT NULL, -- Para Gemini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Crear tabla de historial de chat
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  documents_used UUID[],
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Crear índices optimizados
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_order ON chunks(document_id, chunk_order);
CREATE INDEX idx_embeddings_chunk_id ON embeddings(chunk_id);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);
CREATE INDEX idx_chat_history_created ON chat_history(created_at);

-- 7. Crear índice vectorial para búsquedas rápidas
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);

-- 8. Función optimizada para buscar documentos similares
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source VARCHAR,
    content TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.document_id,
        d.source,
        c.chunk_text as content,
        1 - (e.embedding <=> query_embedding) as similarity_score
    FROM documents d
    JOIN chunks c ON d.document_id = c.document_id
    JOIN embeddings e ON c.chunk_id = e.chunk_id
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 9. Función para obtener estadísticas de la base de datos
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    metric VARCHAR,
    value BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_documents'::VARCHAR, COUNT(*)::BIGINT FROM documents
    UNION ALL
    SELECT 'total_chunks'::VARCHAR, COUNT(*)::BIGINT FROM chunks
    UNION ALL
    SELECT 'total_embeddings'::VARCHAR, COUNT(*)::BIGINT FROM embeddings
    UNION ALL
    SELECT 'total_chat_history'::VARCHAR, COUNT(*)::BIGINT FROM chat_history;
END;
$$;

-- 10. Verificar que todo se creó correctamente
SELECT 'Estructura optimizada creada exitosamente' as status; 