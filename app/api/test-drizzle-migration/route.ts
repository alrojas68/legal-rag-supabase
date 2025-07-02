import { NextRequest, NextResponse } from 'next/server';
import { 
  getCompleteDatabaseStats,
  getAllDocumentsWithStats,
  searchWithBM25Improved,
  searchWithBM25Highlighted,
  searchWithBM25Synonyms,
  getChatHistory,
  saveChatHistory
} from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Probando migración completa a Drizzle...');
    
    const { searchParams } = new URL(req.url);
    const testQuery = searchParams.get('q') || 'condominio';
    
    const results: any = {};

    // 1. Probar estadísticas de base de datos
    console.log('📊 Probando estadísticas de base de datos...');
    try {
      const stats = await getCompleteDatabaseStats();
      results.databaseStats = {
        success: true,
        data: stats
      };
    } catch (error) {
      results.databaseStats = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 2. Probar obtención de documentos
    console.log('📚 Probando obtención de documentos...');
    try {
      const documents = await getAllDocumentsWithStats();
      results.documents = {
        success: true,
        count: documents.length,
        sample: documents.slice(0, 2)
      };
    } catch (error) {
      results.documents = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 3. Probar búsqueda BM25 mejorada
    console.log('🔍 Probando búsqueda BM25 mejorada...');
    try {
      const bm25Results = await searchWithBM25Improved(testQuery, 3);
      results.bm25Improved = {
        success: true,
        count: bm25Results.length,
        sample: bm25Results.slice(0, 2).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          chunkText: chunk.chunkText?.substring(0, 100) + '...',
          bm25Score: chunk.bm25Score?.toFixed(4)
        }))
      };
    } catch (error) {
      results.bm25Improved = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 4. Probar búsqueda con resaltado
    console.log('🔍 Probando búsqueda con resaltado...');
    try {
      const highlightedResults = await searchWithBM25Highlighted(testQuery, 3);
      results.bm25Highlighted = {
        success: true,
        count: highlightedResults.length,
        sample: highlightedResults.slice(0, 2).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          highlightedText: chunk.highlightedText?.substring(0, 100) + '...',
          bm25Score: chunk.bm25Score?.toFixed(4)
        }))
      };
    } catch (error) {
      results.bm25Highlighted = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 5. Probar búsqueda con sinónimos
    console.log('🔍 Probando búsqueda con sinónimos...');
    try {
      const synonymResults = await searchWithBM25Synonyms(testQuery, 3);
      results.bm25Synonyms = {
        success: true,
        count: synonymResults.length,
        sample: synonymResults.slice(0, 2).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          chunkText: chunk.chunkText?.substring(0, 100) + '...',
          bm25Score: chunk.bm25Score?.toFixed(4)
        }))
      };
    } catch (error) {
      results.bm25Synonyms = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 6. Probar chat history
    console.log('💬 Probando chat history...');
    try {
      const chatHistory = await getChatHistory('test-session', 5);
      results.chatHistory = {
        success: true,
        count: chatHistory.length
      };
    } catch (error) {
      results.chatHistory = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // 7. Probar guardar chat history
    console.log('💬 Probando guardar chat history...');
    try {
      await saveChatHistory(
        'Test query from Drizzle migration',
        'Test response from Drizzle migration',
        ['test-document-1', 'test-document-2'],
        'test-session'
      );
      results.saveChatHistory = {
        success: true
      };
    } catch (error) {
      results.saveChatHistory = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // Análisis de resultados
    const successfulTests = Object.values(results).filter((r: any) => r.success).length;
    const totalTests = Object.keys(results).length;

    const analysis = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      success_rate: (successfulTests / totalTests * 100).toFixed(1) + '%',
      migration_status: successfulTests === totalTests ? '✅ COMPLETA' : '⚠️ PARCIAL'
    };

    console.log('📊 Análisis de migración:', analysis);

    return NextResponse.json({
      success: true,
      message: 'Prueba de migración a Drizzle completada',
      query: testQuery,
      results,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en prueba de migración a Drizzle:', error);
    return NextResponse.json({
      success: false,
      error: 'Error general en prueba de migración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 