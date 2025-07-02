import { NextRequest, NextResponse } from 'next/server';
import { 
  searchWithBM25Improved, 
  searchWithBM25Highlighted, 
  searchWithBM25Synonyms,
  searchWithEmbeddings,
  searchHybridComplete
} from '@/lib/db/queries';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini para embeddings
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Función para obtener embeddings usando Gemini
async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length !== 768) {
      throw new Error('Embedding inválido');
    }
    
    return embedding;
  } catch (error) {
    console.error('Error al obtener embeddings:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, testCases = [] } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    console.log('🧪 Probando mejoras de BM25 con Drizzle...');
    const results: any = {};

    // Caso 1: BM25 mejorado con parámetros por defecto
    console.log('🧪 Probando BM25 mejorado (parámetros por defecto)...');
    try {
      const improvedResults = await searchWithBM25Improved(query, 5, 1.2, 0.75);
      
      results.improved_default = {
        success: true,
        error: null,
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

    // Caso 2: BM25 mejorado con parámetros optimizados para documentos largos
    console.log('🧪 Probando BM25 mejorado (parámetros para documentos largos)...');
    try {
      const longDocResults = await searchWithBM25Improved(query, 5, 1.5, 0.5);
      
      results.improved_long_docs = {
        success: true,
        error: null,
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

    // Caso 3: BM25 mejorado con parámetros para documentos cortos
    console.log('🧪 Probando BM25 mejorado (parámetros para documentos cortos)...');
    try {
      const shortDocResults = await searchWithBM25Improved(query, 5, 1.0, 0.8);
      
      results.improved_short_docs = {
        success: true,
        error: null,
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

    // Caso 4: Búsqueda con sinónimos
    console.log('🧪 Probando búsqueda con sinónimos...');
    try {
      const synonymResults = await searchWithBM25Synonyms(query, 5);
      
      results.with_synonyms = {
        success: true,
        error: null,
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

    // Caso 5: Búsqueda con resaltado
    console.log('🧪 Probando búsqueda con resaltado...');
    try {
      const highlightedResults = await searchWithBM25Highlighted(query, 5);
      
      results.with_highlighting = {
        success: true,
        error: null,
        count: highlightedResults?.length || 0,
        results: highlightedResults || []
      };
    } catch (error) {
      results.with_highlighting = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 6: Búsqueda vectorial
    console.log('🧪 Probando búsqueda vectorial...');
    try {
      const queryEmbedding = await getEmbeddings(query);
      const vectorResults = await searchWithEmbeddings(queryEmbedding, 5);
      
      results.vector_search = {
        success: true,
        error: null,
        count: vectorResults?.length || 0,
        results: vectorResults || []
      };
    } catch (error) {
      results.vector_search = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        count: 0,
        results: []
      };
    }

    // Caso 7: Búsqueda híbrida completa
    console.log('🧪 Probando búsqueda híbrida completa...');
    try {
      const queryEmbedding = await getEmbeddings(query);
      const hybridResults = await searchHybridComplete(query, queryEmbedding, 30, 5);
      
      results.hybrid_complete = {
        success: true,
        error: null,
        count: hybridResults?.length || 0,
        results: hybridResults || []
      };
    } catch (error) {
      results.hybrid_complete = {
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
    console.error('❌ Error en pruebas de BM25 con Drizzle:', error);
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