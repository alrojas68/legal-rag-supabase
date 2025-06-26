-- Función para búsqueda BM25
CREATE OR REPLACE FUNCTION search_bm25(
    query_text TEXT,
    limit_count INT DEFAULT 30
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    char_count INTEGER,
    chunk_order INTEGER,
    document_id UUID,
    section_id UUID,
    legal_document_name TEXT,
    legal_document_code TEXT,
    article_number TEXT,
    section_number TEXT,
    paragraph_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    bm25_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.chunk_id,
        c.chunk_text,
        c.char_count,
        c.chunk_order,
        c.document_id,
        c.section_id,
        c.legal_document_name,
        c.legal_document_code,
        c.article_number,
        c.section_number,
        c.paragraph_number,
        c.created_at,
        ts_rank(
            to_tsvector('spanish', c.chunk_text), 
            plainto_tsquery('spanish', query_text)
        ) as bm25_score
    FROM chunks c
    WHERE to_tsvector('spanish', c.chunk_text) @@ plainto_tsquery('spanish', query_text)
    ORDER BY bm25_score DESC
    LIMIT limit_count;
END;
$$;

-- Crear índice GIN para búsqueda de texto completo en chunks
CREATE INDEX IF NOT EXISTS chunks_text_search_idx ON chunks USING GIN (to_tsvector('spanish', chunk_text));

-- Función para búsqueda híbrida (BM25 + Embeddings)
CREATE OR REPLACE FUNCTION search_hybrid(
    query_text TEXT,
    query_embedding VECTOR(768),
    bm25_limit INT DEFAULT 30,
    final_limit INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    chunk_text TEXT,
    char_count INTEGER,
    chunk_order INTEGER,
    document_id UUID,
    section_id UUID,
    legal_document_name TEXT,
    legal_document_code TEXT,
    article_number TEXT,
    section_number TEXT,
    paragraph_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
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
            c.chunk_order,
            c.document_id,
            c.section_id,
            c.legal_document_name,
            c.legal_document_code,
            c.article_number,
            c.section_number,
            c.paragraph_number,
            c.created_at,
            ts_rank(
                to_tsvector('spanish', c.chunk_text), 
                plainto_tsquery('spanish', query_text)
            ) as bm25_score
        FROM chunks c
        WHERE to_tsvector('spanish', c.chunk_text) @@ plainto_tsquery('spanish', query_text)
        ORDER BY bm25_score DESC
        LIMIT bm25_limit
    )
    SELECT 
        bc.chunk_id,
        bc.chunk_text,
        bc.char_count,
        bc.chunk_order,
        bc.document_id,
        bc.section_id,
        bc.legal_document_name,
        bc.legal_document_code,
        bc.article_number,
        bc.section_number,
        bc.paragraph_number,
        bc.created_at,
        (COALESCE(bc.bm25_score, 0) * 0.3 + 
         COALESCE(1 - (e.embedding <=> query_embedding), 0) * 0.7) as combined_score
    FROM bm25_candidates bc
    INNER JOIN embeddings e ON bc.chunk_id = e.chunk_id
    ORDER BY combined_score DESC
    LIMIT final_limit;
END;
$$; 