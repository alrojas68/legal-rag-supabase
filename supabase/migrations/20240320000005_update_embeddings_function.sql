-- Update the function to use Gemini API
create or replace function public.get_embeddings(text_input text)
returns vector(768)
language plpgsql
as $$
declare
  embedding vector(768);
  api_key text;
  api_url text;
  response jsonb;
begin
  -- Obtener la API key de la tabla de configuración
  api_key := get_setting('gemini_api_key');
  if api_key is null then
    raise exception 'API key de Gemini no configurada en la tabla app_settings';
  end if;

  -- Llamar a la API de Gemini
  api_url := 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=' || api_key;
  
  -- Realizar la llamada HTTP
  select content::jsonb into response
  from http_post(
    api_url,
    jsonb_build_object(
      'content', jsonb_build_object(
        'parts', jsonb_build_array(
          jsonb_build_object('text', text_input)
        )
      )
    )::text,
    'application/json'
  );

  -- Extraer el embedding del response
  if response->>'embedding' is null then
    raise exception 'Error al obtener embedding de Gemini: %', response->>'error';
  end if;

  -- Convertir el array JSON a vector
  select array_to_vector(
    array(
      select (jsonb_array_elements(response->'embedding'->'values')::text)::float4
    )
  ) into embedding;

  return embedding;
end;
$$; 