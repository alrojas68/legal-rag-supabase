import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar chunks que contengan "artículo 19" o "Artículo 19"
    console.log('🔍 Buscando chunks que contengan "artículo 19"...');
    
    const { data: chunks, error } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, vector_id')
      .or('chunk_text.ilike.%artículo 19%,chunk_text.ilike.%Artículo 19%,chunk_text.ilike.%ARTÍCULO 19%');

    if (error) {
      console.error('Error al buscar chunks:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    console.log(`📄 Encontrados ${chunks?.length || 0} chunks que contienen "artículo 19"`);

    // También buscar chunks que contengan solo "19" para ver si está fragmentado
    const { data: chunksWith19, error: error19 } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, vector_id')
      .or('chunk_text.ilike.% 19 %,chunk_text.ilike.%19.%');

    if (error19) {
      console.error('Error al buscar chunks con "19":', error19);
    }

    console.log(`📄 Encontrados ${chunksWith19?.length || 0} chunks que contienen "19"`);

    // Buscar chunks que contengan "derechos" o "libertades" (conceptos del artículo 19)
    const { data: chunksWithRights, error: errorRights } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, vector_id')
      .or('chunk_text.ilike.%derechos%,chunk_text.ilike.%libertades%,chunk_text.ilike.%garantías%');

    if (errorRights) {
      console.error('Error al buscar chunks con derechos:', errorRights);
    }

    console.log(`📄 Encontrados ${chunksWithRights?.length || 0} chunks que contienen "derechos/libertades"`);

    // Buscar chunks específicos sobre registro civil y actas de nacimiento
    const { data: chunksWithCivil, error: errorCivil } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, vector_id')
      .or('chunk_text.ilike.%registro civil%,chunk_text.ilike.%acta de nacimiento%,chunk_text.ilike.%ser registrado%,chunk_text.ilike.%identidad%');

    if (errorCivil) {
      console.error('Error al buscar chunks con registro civil:', errorCivil);
    }

    console.log(`📄 Encontrados ${chunksWithCivil?.length || 0} chunks que contienen información sobre registro civil`);

    // Buscar chunks que contengan "artículo 4" (donde está la información sobre registro civil)
    const { data: chunksWithArticle4, error: errorArticle4 } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, vector_id')
      .or('chunk_text.ilike.%artículo 4%,chunk_text.ilike.%Artículo 4%,chunk_text.ilike.%ARTÍCULO 4%');

    if (errorArticle4) {
      console.error('Error al buscar chunks con artículo 4:', errorArticle4);
    }

    console.log(`📄 Encontrados ${chunksWithArticle4?.length || 0} chunks que contienen "artículo 4"`);

    return NextResponse.json({
      success: true,
      article19Chunks: chunks || [],
      chunksWith19: chunksWith19 || [],
      chunksWithRights: chunksWithRights || [],
      chunksWithCivil: chunksWithCivil || [],
      chunksWithArticle4: chunksWithArticle4 || [],
      counts: {
        article19: chunks?.length || 0,
        with19: chunksWith19?.length || 0,
        withRights: chunksWithRights?.length || 0,
        withCivil: chunksWithCivil?.length || 0,
        withArticle4: chunksWithArticle4?.length || 0
      }
    });

  } catch (error) {
    console.error('Error en el endpoint de búsqueda:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 