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

    // Lista de palabras vacías/preposiciones comunes en español
    const stopwords = [
      'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad'];

    // Preprocesar la query para to_tsquery
    let processedQuery = query
      .toLowerCase()
      .replace(/[¿?¡!.,;:()\[\]{}\-_=+<>"'`~@#$%^&*/\\]/g, ' ') // Elimina signos de puntuación
      .split(/\s+/)
      .filter((word: string) => word.length > 2 && !stopwords.includes(word)) // Elimina palabras cortas y stopwords
      .join(' & ');

    if (!processedQuery) {
      return NextResponse.json({
        error: 'La consulta no contiene términos relevantes para la búsqueda BM25',
        success: false
      }, { status: 400 });
    }

    console.log('🔍 BM25: Query original:', query);
    console.log('🔍 BM25: Query procesada para to_tsquery:', processedQuery);

    const supabase = await createClient();
    
    console.log('🔍 BM25: Enviando a función search_chunks_bm25:', {
      search_query: processedQuery,
      result_limit: limit
    });
    
    // Usar la función RPC para búsqueda BM25
    const { data: results, error } = await supabase.rpc('search_chunks_bm25', {
      search_query: processedQuery,
      result_limit: limit
    });

    if (error) {
      console.error('❌ Error en búsqueda BM25:', error);
      // Fallback: búsqueda simple con ILIKE
      console.log('🔄 Intentando búsqueda fallback con ILIKE...');
      // Obtener chunks y luego hacer join manual a documentos
      const { data: fallbackChunks, error: fallbackError } = await supabase
        .from('chunks')
        .select(`
          chunk_id,
          chunk_text,
          start_page,
          end_page,
          char_count,
          document_id
        `)
        .ilike('chunk_text', `%${processedQuery}%`)
        .limit(limit);

      if (fallbackError) {
        console.error('❌ Error en fallback BM25:', fallbackError);
        return NextResponse.json({
          success: false,
          error: 'Error en búsqueda BM25 y fallback',
          details: error.message
        });
      }

      console.log('🔍 BM25 Fallback: Chunks encontrados:', fallbackChunks?.length || 0);

      // Obtener los document_id únicos
      const docIds = (fallbackChunks || []).map((chunk: any) => chunk.document_id).filter(Boolean);
      let documentsMap: Record<string, any> = {};
      if (docIds.length > 0) {
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .in('document_id', docIds);
        if (docsData) {
          for (const doc of docsData) {
            documentsMap[doc.document_id] = doc;
          }
        }
        console.log('🔍 BM25 Fallback: Documentos encontrados:', Object.keys(documentsMap).length);
      }

      const processedResults = (fallbackChunks || []).map((chunk: any) => {
        const doc = documentsMap[chunk.document_id] || {};
        return {
          chunk_id: chunk.chunk_id,
          content: chunk.chunk_text,
          start_page: chunk.start_page,
          end_page: chunk.end_page,
          char_count: chunk.char_count,
          document_id: chunk.document_id,
          source: doc.source,
          publication_date: doc.publication_date,
          last_reform_date: doc.last_reform_date,
          jurisdiction: doc.jurisdiction,
          doc_type: doc.doc_type,
          rank_score: 1.0 // Score fijo para fallback
        };
      });

      console.log(`✅ BM25 Fallback: Resultados procesados: ${processedResults.length}`);

      return NextResponse.json({
        success: true,
        query,
        results: processedResults,
        count: processedResults.length,
        method: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 BM25: Resultados de función search_chunks_bm25:', results?.length || 0);

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

    console.log(`✅ BM25: Resultados procesados: ${processedResults.length}`);

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