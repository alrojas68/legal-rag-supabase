-- Enusre the pgvector extension is enabled. 
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the SQL Data Base
CREATE TABLE IF NOT EXISTS documents (
  document_id UUID PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  publication_date DATE,
  last_reform_date DATE,
  jurisdiction VARCHAR(50),
  doc_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS sections (
  section_id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
  parent_section_id UUID REFERENCES sections(section_id) ON DELETE SET NULL,
  section_type VARCHAR(50),
  section_number VARCHAR(50),
  content_hash VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS chunks (
  chunk_id UUID PRIMARY KEY,
  section_id UUID REFERENCES sections(section_id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  char_count INTEGER,
  vector_id UUID
);

-- Ccreate the Vector Store db
CREATE TABLE IF NOT EXISTS embeddings (
  vector_id UUID PRIMARY KEY,
  chunk_id UUID REFERENCES chunks(chunk_id) ON DELETE CASCADE,
  embedding VECTOR(768), -- Adjusted to 768 for Gemini (verify with API)
  embeddings_order INT, -- Tracks order of embeddings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create HNSW index with cosine distance
CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Función para buscar documentos similares (arreglada)
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

-- Función para buscar chunks similares
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk JSONB,
    section JSONB,
    document JSONB,
    similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        row_to_json(c)::jsonb as chunk,
        row_to_json(s)::jsonb as section,
        row_to_json(d)::jsonb as document,
        1 - (e.embedding <=> query_embedding) as similarity_score
    FROM chunks c
    JOIN sections s ON c.section_id = s.section_id
    JOIN documents d ON s.document_id = d.document_id
    JOIN embeddings e ON c.vector_id = e.vector_id
    ORDER BY similarity_score DESC
    LIMIT match_count;
END;
$$; 