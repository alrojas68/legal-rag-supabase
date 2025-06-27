-- Arreglar la función match_documents para que funcione correctamente
CREATE OR REPLACE FUNCTION match_documents(
    query_text TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source VARCHAR,
    last_reform_date DATE,
    jurisdiction VARCHAR,
    doc_type VARCHAR,
    similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    query_embedding vector(768);
BEGIN
    -- Obtener el embedding de la consulta
    SELECT get_embeddings(query_text) INTO query_embedding;
    
    RETURN QUERY
    SELECT 
        d.document_id,
        d.source,
        d.last_reform_date,
        d.jurisdiction,
        d.doc_type,
        1 - (e.embedding <=> query_embedding) as similarity_score
    FROM documents d
    JOIN sections s ON d.document_id = s.document_id
    JOIN chunks c ON s.section_id = c.section_id
    JOIN embeddings e ON c.vector_id = e.vector_id
    ORDER BY similarity_score DESC
    LIMIT match_count;
END;
$$; 