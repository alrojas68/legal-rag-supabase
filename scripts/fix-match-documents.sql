-- Arreglar la función match_documents para que funcione correctamente
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    source VARCHAR,
    publication_date DATE,
    last_reform_date DATE,
    jurisdiction VARCHAR,
    doc_type VARCHAR,
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
        d.publication_date,
        d.last_reform_date,
        d.jurisdiction,
        d.doc_type,
        c.chunk_text as content,
        1 - (e.embedding <=> query_embedding) as similarity_score
    FROM documents d
    JOIN sections s ON d.document_id = s.document_id
    JOIN chunks c ON s.section_id = c.section_id
    JOIN embeddings e ON c.vector_id = e.vector_id
    ORDER BY similarity_score DESC
    LIMIT match_count;
END;
$$; 