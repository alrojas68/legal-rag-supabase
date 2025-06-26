-- Eliminar todas las funciones match_documents existentes
DROP FUNCTION IF EXISTS match_documents(text, integer);
DROP FUNCTION IF EXISTS match_documents(VECTOR(768), integer);
DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), integer);

-- Crear función simple que funcione con la estructura actual
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source TEXT,
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
    JOIN sections s ON d.document_id = s.document_id
    JOIN chunks c ON s.section_id = c.section_id
    JOIN embeddings e ON c.vector_id = e.vector_id
    WHERE e.embedding IS NOT NULL
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 