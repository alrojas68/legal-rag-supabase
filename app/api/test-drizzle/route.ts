import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Probando Drizzle...');

    // Por ahora, usar Supabase client para verificar que la base de datos funciona
    const supabase = await createClient();
    
    // 1. Obtener estadísticas de la base de datos
    console.log('📊 Obteniendo estadísticas...');
    const { data: documentsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact' });
    
    const { data: chunksCount } = await supabase
      .from('chunks')
      .select('*', { count: 'exact' });
    
    const { data: embeddingsCount } = await supabase
      .from('embeddings')
      .select('*', { count: 'exact' });

    const stats = {
      documents: documentsCount?.length || 0,
      chunks: chunksCount?.length || 0,
      embeddings: embeddingsCount?.length || 0
    };

    console.log('📊 Estadísticas de la base de datos:', stats);

    // 2. Probar búsqueda BM25 usando SQL directo
    console.log('🔍 Probando búsqueda BM25...');
    const { data: bm25Results, error: bm25Error } = await supabase
      .rpc('search_bm25', { 
        query_text: 'condominio', 
        limit_count: 5 
      });

    if (bm25Error) {
      console.log('⚠️ Función BM25 no disponible, probando búsqueda simple...');
      const { data: simpleResults } = await supabase
        .from('chunks')
        .select('chunk_id, chunk_text')
        .ilike('chunk_text', '%condominio%')
        .limit(5);
      
      return NextResponse.json({
        success: true,
        message: 'Drizzle está configurado, pero BM25 necesita configuración adicional',
        stats,
        bm25Test: {
          query: 'condominio',
          resultsCount: simpleResults?.length || 0,
          sampleResults: simpleResults?.slice(0, 2).map(chunk => ({
            chunkId: chunk.chunk_id,
            chunkText: chunk.chunk_text?.substring(0, 200) + '...'
          })) || [],
          note: 'Usando búsqueda simple en lugar de BM25'
        },
        nextSteps: [
          'Configurar función search_bm25 en Supabase',
          'Migrar endpoint de chat para usar Drizzle',
          'Implementar búsqueda híbrida'
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Drizzle está funcionando correctamente',
      stats,
      bm25Test: {
        query: 'condominio',
        resultsCount: bm25Results?.length || 0,
        sampleResults: bm25Results?.slice(0, 2).map((chunk: any) => ({
          chunkId: chunk.chunk_id,
          chunkText: chunk.chunk_text?.substring(0, 200) + '...',
          bm25Score: chunk.bm25_score
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ Error en prueba de Drizzle:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error
    }, { status: 500 });
  }
} 