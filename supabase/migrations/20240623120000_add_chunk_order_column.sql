-- Añade la columna chunk_order a la tabla chunks para mantener el orden de los fragmentos.
ALTER TABLE public.chunks
ADD COLUMN chunk_order INTEGER; 