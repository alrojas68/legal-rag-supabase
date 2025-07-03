import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para buscar documentos usando BM25 (copiada del chat)
async function searchDocumentsBM25(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 BM25: Buscando documentos para:', query);
    
    const { data, error } = await supabase.rpc('search_chunks_bm25', {
      search_query: query,
      result_limit: limit
    });

    if (error) {
      console.error('Error en búsqueda BM25:', error);
      return [];
    }

    console.log('🔍 BM25: Datos crudos recibidos:', {
      count: data?.length || 0,
      sample: data?.[0] || null
    });

    const processedResults = data.map((chunk: any) => ({
      chunk_id: chunk.chunk_id,
      chunk_text: chunk.chunk_text,
      char_count: chunk.char_count,
      document_id: chunk.document_id,
      source: chunk.source || 'Documento legal',
      legal_document_name: chunk.source,
      article_number: chunk.article_number,
      similarity_score: chunk.rank_score,
      content: chunk.chunk_text
    }));

    console.log(`✅ BM25: ${processedResults.length} resultados encontrados`);
    console.log('🔍 BM25: Primer resultado procesado:', processedResults[0] || null);
    return processedResults;
  } catch (error) {
    console.error('Error en búsqueda BM25:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testQuery = url.searchParams.get('query') || "herencia";

    console.log('🧪 Probando searchDocumentsBM25 con query:', testQuery);

    const results = await searchDocumentsBM25(testQuery, 5);

    return NextResponse.json({
      success: true,
      test_query: testQuery,
      results_count: results.length,
      results: results
    });

  } catch (error) {
    console.error('Error en test chat BM25:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 