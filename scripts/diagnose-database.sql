-- Script de diagnóstico para analizar la estructura de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura actual de las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('documents', 'sections', 'chunks', 'embeddings')
ORDER BY table_name, ordinal_position;

-- 2. Contar registros en cada tabla
SELECT 'documents' as tabla, COUNT(*) as total FROM documents
UNION ALL
SELECT 'sections' as tabla, COUNT(*) as total FROM sections
UNION ALL
SELECT 'chunks' as tabla, COUNT(*) as total FROM chunks
UNION ALL
SELECT 'embeddings' as tabla, COUNT(*) as total FROM embeddings;

-- 3. Analizar documentos y sus secciones
SELECT 
    d.document_id,
    d.source,
    d.publication_date,
    d.last_reform_date,
    d.jurisdiction,
    d.doc_type,
    COUNT(s.section_id) as secciones,
    COUNT(c.chunk_id) as chunks,
    COUNT(e.vector_id) as embeddings
FROM documents d
LEFT JOIN sections s ON d.document_id = s.document_id
LEFT JOIN chunks c ON s.section_id = c.section_id
LEFT JOIN embeddings e ON c.vector_id = e.vector_id
GROUP BY d.document_id, d.source, d.publication_date, d.last_reform_date, d.jurisdiction, d.doc_type
ORDER BY d.source;

-- 4. Verificar campos NULL en documentos
SELECT 
    'publication_date' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents) as porcentaje_null
FROM documents 
WHERE publication_date IS NULL
UNION ALL
SELECT 
    'last_reform_date' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents) as porcentaje_null
FROM documents 
WHERE last_reform_date IS NULL
UNION ALL
SELECT 
    'jurisdiction' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents) as porcentaje_null
FROM documents 
WHERE jurisdiction IS NULL
UNION ALL
SELECT 
    'doc_type' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents) as porcentaje_null
FROM documents 
WHERE doc_type IS NULL;

-- 5. Verificar campos NULL en sections
SELECT 
    'section_type' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sections) as porcentaje_null
FROM sections 
WHERE section_type IS NULL
UNION ALL
SELECT 
    'section_number' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sections) as porcentaje_null
FROM sections 
WHERE section_number IS NULL
UNION ALL
SELECT 
    'content_hash' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sections) as porcentaje_null
FROM sections 
WHERE content_hash IS NULL;

-- 6. Verificar campos NULL en chunks
SELECT 
    'start_page' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM chunks) as porcentaje_null
FROM chunks 
WHERE start_page IS NULL
UNION ALL
SELECT 
    'end_page' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM chunks) as porcentaje_null
FROM chunks 
WHERE end_page IS NULL
UNION ALL
SELECT 
    'char_count' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM chunks) as porcentaje_null
FROM chunks 
WHERE char_count IS NULL
UNION ALL
SELECT 
    'vector_id' as campo,
    COUNT(*) as total_null,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM chunks) as porcentaje_null
FROM chunks 
WHERE vector_id IS NULL;

-- 7. Analizar el tamaño de los chunks
SELECT 
    MIN(char_count) as min_chars,
    MAX(char_count) as max_chars,
    AVG(char_count) as avg_chars,
    COUNT(*) as total_chunks
FROM chunks;

-- 8. Verificar si hay chunks duplicados o muy similares
SELECT 
    chunk_text,
    COUNT(*) as ocurrencias
FROM chunks
GROUP BY chunk_text
HAVING COUNT(*) > 1
ORDER BY ocurrencias DESC
LIMIT 10;

-- 9. Verificar la distribución de embeddings
SELECT 
    COUNT(*) as total_embeddings,
    COUNT(DISTINCT chunk_id) as chunks_con_embedding,
    (SELECT COUNT(*) FROM chunks) as total_chunks
FROM embeddings; 