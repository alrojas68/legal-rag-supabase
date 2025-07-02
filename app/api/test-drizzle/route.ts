import { NextRequest, NextResponse } from 'next/server';
import { getCompleteDatabaseStats, searchWithBM25Improved } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Probando Drizzle con nuevas funciones...');

    // 1. Obtener estadísticas completas de la base de datos
    console.log('📊 Obteniendo estadísticas completas...');
    const stats = await getCompleteDatabaseStats();

    console.log('📊 Estadísticas de la base de datos:', stats);

    // 2. Probar búsqueda BM25 usando Drizzle
    console.log('🔍 Probando búsqueda BM25 con Drizzle...');
    const bm25Results = await searchWithBM25Improved('condominio', 5);

    return NextResponse.json({
      success: true,
      message: 'Drizzle está funcionando correctamente con las nuevas funciones',
      stats,
      bm25Test: {
        query: 'condominio',
        resultsCount: bm25Results?.length || 0,
        sampleResults: bm25Results?.slice(0, 2).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          chunkText: chunk.chunkText?.substring(0, 200) + '...',
          bm25Score: chunk.bm25Score?.toFixed(4)
        })) || [],
        note: 'Usando búsqueda BM25 mejorada con Drizzle'
      },
      nextSteps: [
        '✅ Drizzle configurado y funcionando',
        '✅ Funciones de queries implementadas',
        '✅ Endpoints migrados',
        '🔄 Optimizar queries para mejor performance',
        '🔄 Implementar cache para queries frecuentes'
      ]
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