-- Script para arreglar la estructura de la base de datos
-- Ejecutar este script en Supabase SQL Editor si es necesario

-- Verificar si la columna created_at existe en documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE documents ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Columna created_at agregada a la tabla documents';
    ELSE
        RAISE NOTICE 'La columna created_at ya existe en documents';
    END IF;
END $$;

-- Verificar si la columna created_at existe en sections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sections' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE sections ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Columna created_at agregada a la tabla sections';
    ELSE
        RAISE NOTICE 'La columna created_at ya existe en sections';
    END IF;
END $$;

-- Verificar si la columna created_at existe en chunks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chunks' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE chunks ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Columna created_at agregada a la tabla chunks';
    ELSE
        RAISE NOTICE 'La columna created_at ya existe en chunks';
    END IF;
END $$;

-- Verificar si la columna created_at existe en embeddings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embeddings' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE embeddings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        RAISE NOTICE 'Columna created_at agregada a la tabla embeddings';
    ELSE
        RAISE NOTICE 'La columna created_at ya existe en embeddings';
    END IF;
END $$;

-- Actualizar registros existentes con fechas por defecto si es necesario
UPDATE documents SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
UPDATE sections SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
UPDATE chunks SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
UPDATE embeddings SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

-- Mostrar la estructura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('documents', 'sections', 'chunks', 'embeddings')
ORDER BY table_name, ordinal_position; 