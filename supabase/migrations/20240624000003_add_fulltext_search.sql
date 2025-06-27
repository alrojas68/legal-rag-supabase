-- Agregar índices de texto completo para búsqueda BM25
-- Crear columna tsvector para búsqueda de texto completo
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS chunk_text_tsv tsvector;

-- Crear función para actualizar el tsvector
CREATE OR REPLACE FUNCTION update_chunk_text_tsv() RETURNS trigger AS $$
BEGIN
  NEW.chunk_text_tsv := to_tsvector('spanish', NEW.chunk_text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el tsvector
DROP TRIGGER IF EXISTS update_chunk_text_tsv_trigger ON chunks;
CREATE TRIGGER update_chunk_text_tsv_trigger
  BEFORE INSERT OR UPDATE ON chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_chunk_text_tsv();

-- Crear índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS chunks_text_search_idx ON chunks USING GIN (chunk_text_tsv);

-- Actualizar todos los registros existentes
UPDATE chunks SET chunk_text_tsv = to_tsvector('spanish', chunk_text) WHERE chunk_text_tsv IS NULL;

-- Elimina la función anterior si existe
DROP FUNCTION IF EXISTS search_chunks_bm25(text, integer);

-- Función para búsqueda BM25 minimalista
CREATE OR REPLACE FUNCTION search_chunks_bm25(
    search_query TEXT,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    char_count INTEGER,
    document_id UUID,
    source TEXT,
    article_number TEXT,
    rank_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.char_count,
        c.document_id,
        d.source,
        c.article_number,
        ts_rank(c.chunk_text_tsv, to_tsquery('spanish', search_query)) as rank_score
    FROM chunks c
    JOIN documents d ON c.document_id = d.document_id
    WHERE c.chunk_text_tsv @@ to_tsquery('spanish', search_query)
    ORDER BY rank_score DESC
    LIMIT result_limit;
END;
$$;