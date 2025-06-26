-- Enable the pgvector extension
create extension if not exists vector;

-- Create the function to generate embeddings
create or replace function public.get_embeddings(text_input text)
returns vector(768)
language plpgsql
as $$
declare
  embedding vector(768);
begin
  -- Aquí deberías llamar a tu modelo de embeddings preferido
  -- Por ahora, generamos un vector aleatorio de 768 dimensiones como ejemplo
  select array_to_vector(array(
    select random()::float4
    from generate_series(1, 768)
  )) into embedding;
  
  return embedding;
end;
$$; 