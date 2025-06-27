-- Fix the function name in match_documents

-- Elimina la función anterior si existe
DROP FUNCTION IF EXISTS match_documents(text, integer);

CREATE OR REPLACE FUNCTION match_documents(
    query_text TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source VARCHAR,
    chunk_id UUID,
    chunk_text TEXT,
    article_number TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH query_embedding AS (
        SELECT embedding
        FROM get_embeddings(query_text)
    )
    SELECT 
        d.document_id,
        d.source,
        c.chunk_id,
        c.chunk_text,
        c.article_number,
        1 - (e.embedding <=> (SELECT embedding FROM query_embedding)) as similarity_score
    FROM documents d
    JOIN chunks c ON d.document_id = c.document_id
    JOIN embeddings e ON c.chunk_id = e.chunk_id
    ORDER BY similarity_score DESC
    LIMIT match_count;
END;
$$; 