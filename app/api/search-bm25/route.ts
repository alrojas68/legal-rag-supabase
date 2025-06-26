import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    console.log('🔍 BM25: Buscando documentos para:', query);
    
    // Usar la función RPC para búsqueda BM25
    const { data: results, error } = await supabase.rpc('search_chunks_bm25', {
      search_query: query,
      result_limit: limit
    });

    if (error) {
      console.error('❌ Error en búsqueda BM25:', error);
      
      // Fallback: búsqueda simple con ILIKE
      console.log('🔄 Intentando búsqueda fallback con ILIKE...');
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('chunks')
        .select(`
          chunk_id,
          chunk_text,
          start_page,
          end_page,
          char_count,
          sections!inner(
            section_id,
            section_type,
            section_number,
            documents!inner(
              document_id,
              source,
              publication_date,
              last_reform_date,
              jurisdiction,
              doc_type
            )
          )
        `)
        .ilike('chunk_text', `%${query}%`)
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json({
          success: false,
          error: 'Error en búsqueda BM25 y fallback',
          details: error.message
        });
      }

      const processedResults = fallbackResults?.map((chunk: any) => ({
        chunk_id: chunk.chunk_id,
        content: chunk.chunk_text,
        start_page: chunk.start_page,
        end_page: chunk.end_page,
        char_count: chunk.char_count,
        document_id: chunk.sections.documents.document_id,
        source: chunk.sections.documents.source,
        publication_date: chunk.sections.documents.publication_date,
        last_reform_date: chunk.sections.documents.last_reform_date,
        jurisdiction: chunk.sections.documents.jurisdiction,
        doc_type: chunk.sections.documents.doc_type,
        section_type: chunk.sections.section_type,
        section_number: chunk.sections.section_number,
        rank_score: 1.0 // Score fijo para fallback
      })) || [];

      console.log(`✅ BM25 Fallback: Encontrados ${processedResults.length} resultados`);

      return NextResponse.json({
        success: true,
        query,
        results: processedResults,
        count: processedResults.length,
        method: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    // Procesar resultados de la función RPC
    const processedResults = results?.map((chunk: any) => ({
      chunk_id: chunk.chunk_id,
      content: chunk.chunk_text,
      start_page: chunk.start_page,
      end_page: chunk.end_page,
      char_count: chunk.char_count,
      document_id: chunk.document_id,
      source: chunk.source,
      publication_date: chunk.publication_date,
      last_reform_date: chunk.last_reform_date,
      jurisdiction: chunk.jurisdiction,
      doc_type: chunk.doc_type,
      section_type: chunk.section_type,
      section_number: chunk.section_number,
      rank_score: chunk.rank_score
    })) || [];

    console.log(`✅ BM25: Encontrados ${processedResults.length} resultados`);

    return NextResponse.json({
      success: true,
      query,
      results: processedResults,
      count: processedResults.length,
      method: 'fulltext',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error general en BM25:', error);
    return NextResponse.json({
      success: false,
      error: 'Error general al realizar búsqueda BM25',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Endpoint GET para pruebas
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query) {
    return NextResponse.json({
      error: 'Se requiere parámetro de consulta (q)',
      success: false
    }, { status: 400 });
  }

  // Reutilizar la lógica del POST
  const mockReq = {
    json: async () => ({ query, limit })
  } as NextRequest;

  return POST(mockReq);
} 