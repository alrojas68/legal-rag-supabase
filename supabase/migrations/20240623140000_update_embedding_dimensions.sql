-- Actualizar las dimensiones de embeddings de 1536 a 768 para compatibilidad con Gemini
-- Primero eliminamos el índice existente
DROP INDEX IF EXISTS embeddings_vector_idx;

-- Cambiamos la dimensión del vector de 1536 a 768
ALTER TABLE public.embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- Recreamos el índice con la nueva dimensión
CREATE INDEX embeddings_vector_idx ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); 