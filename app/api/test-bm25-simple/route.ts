import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables de entorno de Supabase requeridas');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const url = new URL(req.url);
    const testQuery = url.searchParams.get('query') || "artículo 19";

    console.log('🧪 Probando funciones BM25 con query:', testQuery);

    // Probar función search_chunks_bm25_improved
    console.log('🔍 Probando search_chunks_bm25_improved...');
    const { data: bm25Results, error: bm25Error } = await supabase.rpc('search_chunks_bm25_improved', {
      search_query: testQuery,
      result_limit: 5
    });

    if (bm25Error) {
      console.error('❌ Error en search_chunks_bm25_improved:', bm25Error);
    } else {
      console.log('✅ search_chunks_bm25_improved funcionó:', bm25Results?.length || 0, 'resultados');
    }

    // Probar función search_chunks_bm25 (más simple)
    console.log('🔍 Probando search_chunks_bm25...');
    const { data: bm25SimpleResults, error: bm25SimpleError } = await supabase.rpc('search_chunks_bm25', {
      search_query: testQuery,
      result_limit: 5
    });

    if (bm25SimpleError) {
      console.error('❌ Error en search_chunks_bm25:', bm25SimpleError);
    } else {
      console.log('✅ search_chunks_bm25 funcionó:', bm25SimpleResults?.length || 0, 'resultados');
    }

    // Verificar qué funciones existen
    console.log('🔍 Verificando funciones disponibles...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .like('routine_name', '%bm25%');

    if (functionsError) {
      console.error('❌ Error al verificar funciones:', functionsError);
    } else {
      console.log('✅ Funciones BM25 disponibles:', functions?.map(f => f.routine_name) || []);
    }

    return NextResponse.json({
      success: true,
      test_query: testQuery,
      bm25_improved: {
        success: !bm25Error,
        results: bm25Results?.length || 0,
        error: bm25Error?.message
      },
      bm25_simple: {
        success: !bm25SimpleError,
        results: bm25SimpleResults?.length || 0,
        error: bm25SimpleError?.message
      },
      available_functions: functions?.map(f => f.routine_name) || []
    });

  } catch (error) {
    console.error('Error en test BM25:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 