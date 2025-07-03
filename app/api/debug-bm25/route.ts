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
    const testQuery = url.searchParams.get('query') || "herencia";

    console.log('🔍 Debug BM25 con query:', testQuery);

    // Probar función search_chunks_bm25 directamente
    console.log('🔍 Probando search_chunks_bm25...');
    const { data: bm25Results, error: bm25Error } = await supabase.rpc('search_chunks_bm25', {
      search_query: testQuery,
      result_limit: 5
    });

    console.log('📊 Resultados BM25:', {
      success: !bm25Error,
      count: bm25Results?.length || 0,
      error: bm25Error?.message,
      results: bm25Results
    });

    // Probar búsqueda SQL directa para comparar
    console.log('🔍 Probando búsqueda SQL directa...');
    const { data: sqlResults, error: sqlError } = await supabase
      .from('chunks')
      .select(`
        chunk_id,
        chunk_text,
        char_count,
        article_number,
        sections!inner(
          section_id,
          documents!inner(
            document_id,
            source
          )
        )
      `)
      .textSearch('chunk_text', testQuery, {
        type: 'plain',
        config: 'spanish'
      })
      .limit(5);

    console.log('📊 Resultados SQL directa:', {
      success: !sqlError,
      count: sqlResults?.length || 0,
      error: sqlError?.message,
      results: sqlResults
    });

    // Verificar si hay datos en la tabla chunks
    console.log('🔍 Verificando datos en chunks...');
    const { data: chunkCount, error: countError } = await supabase
      .from('chunks')
      .select('chunk_id', { count: 'exact' });

    console.log('📊 Total de chunks:', {
      count: chunkCount?.length || 0,
      error: countError?.message
    });

    // Verificar si hay índices de texto completo
    console.log('🔍 Verificando índices...');
    const { data: indexResults, error: indexError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            indexname, 
            indexdef 
          FROM pg_indexes 
          WHERE tablename = 'chunks' 
          AND indexdef LIKE '%tsvector%'
        `
      });

    console.log('📊 Índices encontrados:', {
      success: !indexError,
      count: indexResults?.length || 0,
      error: indexError?.message,
      indexes: indexResults
    });

    return NextResponse.json({
      success: true,
      test_query: testQuery,
      bm25_function: {
        success: !bm25Error,
        count: bm25Results?.length || 0,
        error: bm25Error?.message,
        results: bm25Results?.slice(0, 2) // Solo primeros 2 para no saturar
      },
      sql_direct: {
        success: !sqlError,
        count: sqlResults?.length || 0,
        error: sqlError?.message,
        results: sqlResults?.slice(0, 2) // Solo primeros 2 para no saturar
      },
      database_stats: {
        total_chunks: chunkCount?.length || 0,
        count_error: countError?.message
      },
      indexes: {
        success: !indexError,
        count: indexResults?.length || 0,
        error: indexError?.message,
        indexes: indexResults
      }
    });

  } catch (error) {
    console.error('Error en debug BM25:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 