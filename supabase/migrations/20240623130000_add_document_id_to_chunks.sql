-- Añade la columna document_id a la tabla chunks para relacionar directamente con documentos.
ALTER TABLE public.chunks
ADD COLUMN document_id UUID REFERENCES public.documents(document_id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento de consultas por document_id
CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON public.chunks(document_id); 