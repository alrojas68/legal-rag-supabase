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

-- Función para búsqueda BM25 mejorada
CREATE OR REPLACE FUNCTION search_chunks_bm25(
    search_query TEXT,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    start_page INTEGER,
    end_page INTEGER,
    char_count INTEGER,
    document_id UUID,
    source TEXT,
    publication_date DATE,
    last_reform_date DATE,
    jurisdiction TEXT,
    doc_type TEXT,
    section_type TEXT,
    section_number TEXT,
    rank_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.start_page,
        c.end_page,
        c.char_count,
        d.document_id,
        d.source,
        d.publication_date,
        d.last_reform_date,
        d.jurisdiction,
        d.doc_type,
        s.section_type,
        s.section_number,
        ts_rank(c.chunk_text_tsv, to_tsquery('spanish', search_query)) as rank_score
    FROM chunks c
    JOIN sections s ON c.section_id = s.section_id
    JOIN documents d ON s.document_id = d.document_id
    WHERE c.chunk_text_tsv @@ to_tsquery('spanish', search_query)
    ORDER BY rank_score DESC
    LIMIT result_limit;
END;
$$; 