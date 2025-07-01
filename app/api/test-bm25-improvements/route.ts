import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { query, testCases = [] } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    const supabase = await createClient();
    const results: any = {};

    // Caso 1: BM25 original (función anterior)
    console.log('🧪 Probando BM25 original...');
    try {
      const { data: originalResults, error: originalError } = await supabase.rpc('search_chunks_bm25', {
        search_query: query,
        result_limit: 5
      });
      
      results.original = {
        success: !originalError,
        error: originalError?.message,
        count: originalResults?.length || 0,
        results: originalResults || []
      };
    } catch (error) {
      results.original = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 2: BM25 mejorado con parámetros por defecto
    console.log('🧪 Probando BM25 mejorado (parámetros por defecto)...');
    try {
      const { data: improvedResults, error: improvedError } = await supabase.rpc('search_chunks_bm25_improved', {
        search_query: query,
        result_limit: 5,
        k1_param: 1.2,
        b_param: 0.75
      });
      
      results.improved_default = {
        success: !improvedError,
        error: improvedError?.message,
        count: improvedResults?.length || 0,
        results: improvedResults || []
      };
    } catch (error) {
      results.improved_default = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 3: BM25 mejorado con parámetros optimizados para documentos largos
    console.log('🧪 Probando BM25 mejorado (parámetros para documentos largos)...');
    try {
      const { data: longDocResults, error: longDocError } = await supabase.rpc('search_chunks_bm25_improved', {
        search_query: query,
        result_limit: 5,
        k1_param: 1.5,
        b_param: 0.5
      });
      
      results.improved_long_docs = {
        success: !longDocError,
        error: longDocError?.message,
        count: longDocResults?.length || 0,
        results: longDocResults || []
      };
    } catch (error) {
      results.improved_long_docs = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 4: BM25 mejorado con parámetros para documentos cortos
    console.log('🧪 Probando BM25 mejorado (parámetros para documentos cortos)...');
    try {
      const { data: shortDocResults, error: shortDocError } = await supabase.rpc('search_chunks_bm25_improved', {
        search_query: query,
        result_limit: 5,
        k1_param: 1.0,
        b_param: 0.8
      });
      
      results.improved_short_docs = {
        success: !shortDocError,
        error: shortDocError?.message,
        count: shortDocResults?.length || 0,
        results: shortDocResults || []
      };
    } catch (error) {
      results.improved_short_docs = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 5: Búsqueda con sinónimos
    console.log('🧪 Probando búsqueda con sinónimos...');
    try {
      const { data: synonymResults, error: synonymError } = await supabase.rpc('search_chunks_with_synonyms', {
        search_query: query,
        result_limit: 5
      });
      
      results.with_synonyms = {
        success: !synonymError,
        error: synonymError?.message,
        count: synonymResults?.length || 0,
        results: synonymResults || []
      };
    } catch (error) {
      results.with_synonyms = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 6: Búsqueda de texto completo nativa de PostgreSQL
    console.log('🧪 Probando búsqueda de texto completo nativa...');
    try {
      const { data: nativeResults, error: nativeError } = await supabase
        .from('chunks')
        .select(`
          chunk_id,
          chunk_text,
          char_count,
          document_id,
          ts_rank(chunk_text_tsv, to_tsquery('spanish', $1)) as rank_score
        `)
        .textSearch('chunk_text', query, {
          type: 'plain',
          config: 'spanish'
        })
        .order('rank_score', { ascending: false })
        .limit(5);

      results.native_fulltext = {
        success: !nativeError,
        error: nativeError?.message,
        count: nativeResults?.length || 0,
        results: nativeResults || []
      };
    } catch (error) {
      results.native_fulltext = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Análisis comparativo
    const analysis = {
      total_tests: Object.keys(results).length,
      successful_tests: Object.values(results).filter((r: any) => r.success).length,
      average_results: Object.values(results)
        .filter((r: any) => r.success)
        .reduce((acc: number, r: any) => acc + r.count, 0) / 
        Object.values(results).filter((r: any) => r.success).length || 0,
      best_performing: Object.entries(results)
        .filter(([_, r]: [string, any]) => r.success)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.count - a.count)[0]?.[0] || 'none'
    };

    console.log('📊 Análisis comparativo:', analysis);

    return NextResponse.json({
      success: true,
      query,
      results,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en pruebas de BM25:', error);
    return NextResponse.json({
      success: false,
      error: 'Error general en pruebas de BM25',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Endpoint GET para pruebas rápidas
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'derechos civiles';

  const mockReq = {
    json: async () => ({ query })
  } as NextRequest;

  return POST(mockReq);
} 