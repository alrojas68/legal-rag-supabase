-- Eliminar todas las funciones match_documents existentes
DROP FUNCTION IF EXISTS match_documents(text, integer);
DROP FUNCTION IF EXISTS match_documents(VECTOR(768), integer);
DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), integer);

-- Crear función corregida que use la relación correcta entre chunks y embeddings
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source TEXT,
    legal_document_name TEXT,
    content TEXT,
    chunk_id UUID,
    similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.document_id,
        d.source,
        d.source as legal_document_name, -- Usar source como nombre del documento
        c.chunk_text as content,         -- Usar chunk_text como contenido
        c.chunk_id,
        1 - (e.embedding <=> query_embedding) as similarity_score
    FROM documents d
    JOIN sections s ON d.document_id = s.document_id
    JOIN chunks c ON s.section_id = c.section_id
    JOIN embeddings e ON c.chunk_id = e.chunk_id  -- Corregido: usar chunk_id en lugar de vector_id
    WHERE e.embedding IS NOT NULL
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 