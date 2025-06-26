-- Script para limpiar completamente la base de datos
-- IMPORTANTE: Ejecutar en este orden para respetar las restricciones de clave foránea

-- 1. Primero eliminar embeddings (referencian chunks)
DELETE FROM embeddings;

-- 2. Luego eliminar chunks (referencian sections)
DELETE FROM chunks;

-- 3. Luego eliminar sections (referencian documents)
DELETE FROM sections;

-- 4. Finalmente eliminar documents
DELETE FROM documents;

-- 5. Limpiar historial de chat si existe
DELETE FROM chat_history;

-- 6. Verificar que las tablas estén vacías
SELECT 'embeddings' as tabla, COUNT(*) as registros FROM embeddings
UNION ALL
SELECT 'chunks' as tabla, COUNT(*) as registros FROM chunks
UNION ALL
SELECT 'sections' as tabla, COUNT(*) as registros FROM sections
UNION ALL
SELECT 'documents' as tabla, COUNT(*) as registros FROM documents
UNION ALL
SELECT 'chat_history' as tabla, COUNT(*) as registros FROM chat_history;

-- 7. Resetear las secuencias si existen
-- (Esto es opcional, pero ayuda a mantener los IDs limpios)
-- ALTER SEQUENCE IF EXISTS documents_document_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS sections_section_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS chunks_chunk_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS embeddings_vector_id_seq RESTART WITH 1; 