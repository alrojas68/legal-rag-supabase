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
    rank_score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.char_count,
        d.document_id,
        d.source,
        c.article_number,
        ts_rank(c.chunk_text_tsv, to_tsquery('spanish', search_query))::double precision as rank_score
    FROM chunks c
    JOIN sections s ON c.section_id = s.section_id
    JOIN documents d ON s.document_id = d.document_id
    WHERE c.chunk_text_tsv @@ to_tsquery('spanish', search_query)
    ORDER BY rank_score DESC
    LIMIT result_limit;
END;
$$;

-- NUEVA FUNCIÓN MEJORADA: Búsqueda BM25 con parámetros ajustables y resaltado
CREATE OR REPLACE FUNCTION search_chunks_bm25_improved(
    search_query TEXT,
    result_limit INTEGER DEFAULT 10,
    k1_param FLOAT DEFAULT 1.2,
    b_param FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    char_count INTEGER,
    document_id UUID,
    source TEXT,
    publication_date DATE,
    last_reform_date DATE,
    jurisdiction TEXT,
    doc_type TEXT,
    section_type TEXT,
    section_number TEXT,
    article_number TEXT,
    start_page INTEGER,
    end_page INTEGER,
    highlighted_text TEXT,
    rank_score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.char_count,
        d.document_id,
        d.source,
        d.publication_date,
        d.last_reform_date,
        d.jurisdiction,
        d.doc_type,
        s.section_type,
        s.section_number,
        c.article_number,
        c.start_page,
        c.end_page,
        -- Resaltado de texto con ts_headline
        ts_headline(
            'spanish', 
            c.chunk_text, 
            to_tsquery('spanish', search_query), 
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) as highlighted_text,
        -- BM25 con parámetros ajustables usando ts_rank_cd (BM25)
        ts_rank_cd(
            c.chunk_text_tsv, 
            to_tsquery('spanish', search_query),
            k1_param,
            b_param
        )::double precision as rank_score
    FROM chunks c
    JOIN sections s ON c.section_id = s.section_id
    JOIN documents d ON s.document_id = d.document_id
    WHERE c.chunk_text_tsv @@ to_tsquery('spanish', search_query)
    ORDER BY rank_score DESC
    LIMIT result_limit;
END;
$$;

-- Función para búsqueda con sinónimos legales
CREATE OR REPLACE FUNCTION search_chunks_with_synonyms(
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
    rank_score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
DECLARE
    expanded_query TEXT;
BEGIN
    -- Expandir query con sinónimos legales
    expanded_query := search_query;
    
    -- Reemplazar términos con sus sinónimos
    expanded_query := replace(expanded_query, 'ley', '(ley | norma | reglamento | código | decreto)');
    expanded_query := replace(expanded_query, 'artículo', '(artículo | art)');
    expanded_query := replace(expanded_query, 'derecho', '(derecho | derechos | garantía | garantías)');
    expanded_query := replace(expanded_query, 'obligación', '(obligación | obligaciones | deber | deberes)');
    expanded_query := replace(expanded_query, 'responsabilidad', '(responsabilidad | responsabilidades | culpa | culpabilidad)');
    expanded_query := replace(expanded_query, 'procedimiento', '(procedimiento | procedimientos | trámite | trámites)');
    expanded_query := replace(expanded_query, 'registro', '(registro | registros | inscripción | inscripciones)');
    expanded_query := replace(expanded_query, 'documento', '(documento | documentos | acta | actas)');
    expanded_query := replace(expanded_query, 'oficial', '(oficial | oficiales | público | públicos)');
    
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.char_count,
        d.document_id,
        d.source,
        c.article_number,
        ts_rank(c.chunk_text_tsv, to_tsquery('spanish', expanded_query))::double precision as rank_score
    FROM chunks c
    JOIN sections s ON c.section_id = s.section_id
    JOIN documents d ON s.document_id = d.document_id
    WHERE c.chunk_text_tsv @@ to_tsquery('spanish', expanded_query)
    ORDER BY rank_score DESC
    LIMIT result_limit;
END;
$$;

-- Función para búsqueda híbrida mejorada (BM25 + Embeddings)
CREATE OR REPLACE FUNCTION search_hybrid_improved(
    query_text TEXT,
    query_embedding VECTOR(768),
    bm25_limit INT DEFAULT 30,
    final_limit INT DEFAULT 10,
    k1_param FLOAT DEFAULT 1.2,
    b_param FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    char_count INTEGER,
    document_id UUID,
    source TEXT,
    publication_date DATE,
    last_reform_date DATE,
    jurisdiction TEXT,
    doc_type TEXT,
    section_type TEXT,
    section_number TEXT,
    article_number TEXT,
    start_page INTEGER,
    end_page INTEGER,
    highlighted_text TEXT,
    bm25_score FLOAT,
    vector_score FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH bm25_candidates AS (
        SELECT 
            c.chunk_id,
            c.chunk_text,
            c.char_count,
            c.section_id,
            c.section_type,
            c.section_number,
            c.article_number,
            c.start_page,
            c.end_page,
            ts_rank_cd(
                c.chunk_text_tsv, 
                to_tsquery('spanish', query_text),
                k1_param,
                b_param
            ) as bm25_score
        FROM chunks c
        WHERE c.chunk_text_tsv @@ to_tsquery('spanish', query_text)
        ORDER BY bm25_score DESC
        LIMIT bm25_limit
    )
    SELECT 
        bc.chunk_id,
        bc.chunk_text,
        bc.char_count,
        d.document_id,
        d.source,
        d.publication_date,
        d.last_reform_date,
        d.jurisdiction,
        d.doc_type,
        bc.section_type,
        bc.section_number,
        bc.article_number,
        bc.start_page,
        bc.end_page,
        ts_headline(
            'spanish', 
            bc.chunk_text, 
            to_tsquery('spanish', query_text), 
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) as highlighted_text,
        bc.bm25_score,
        (1 - (e.embedding <=> query_embedding))::float as vector_score,
        (COALESCE(bc.bm25_score, 0) * 0.3 + 
         COALESCE(1 - (e.embedding <=> query_embedding), 0) * 0.7)::float as combined_score
    FROM bm25_candidates bc
    INNER JOIN embeddings e ON bc.chunk_id = e.chunk_id
    INNER JOIN sections s ON bc.section_id = s.section_id
    INNER JOIN documents d ON s.document_id = d.document_id
    ORDER BY combined_score DESC
    LIMIT final_limit;
END;
$$;