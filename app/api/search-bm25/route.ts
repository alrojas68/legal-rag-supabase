import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Función para stemming básico en español (simplificada)
function stemSpanishWord(word: string): string {
  // Reglas básicas de stemming para español
  const suffixes = [
    { pattern: /(ar|er|ir)$/, replacement: '' }, // verbos infinitivos
    { pattern: /(ando|iendo)$/, replacement: '' }, // gerundios
    { pattern: /(ado|ido)$/, replacement: '' }, // participios
    { pattern: /(a|e|i|o|u)s$/, replacement: '' }, // plurales
    { pattern: /(mente)$/, replacement: '' }, // adverbios
    { pattern: /(ción|siones)$/, replacement: 'c' }, // sustantivos en -ción
    { pattern: /(dad|dades)$/, replacement: 'd' }, // sustantivos en -dad
    { pattern: /(tad|tades)$/, replacement: 't' }, // sustantivos en -tad
  ];

  let stemmed = word.toLowerCase();
  for (const { pattern, replacement } of suffixes) {
    if (pattern.test(stemmed)) {
      stemmed = stemmed.replace(pattern, replacement);
      break; // Solo aplicar una regla por palabra
    }
  }
  
  return stemmed;
}

// Stopwords optimizadas para dominio legal
const legalStopwords = [
  // Stopwords generales
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad',
  // Términos legales que SÍ queremos conservar (NO son stopwords)
  // 'artículo', 'ley', 'código', 'reglamento', 'decreto', 'norma', 'cláusula', 'sección', 'capítulo', 'título'
];

// Diccionario de sinónimos legales
const legalSynonyms: Record<string, string[]> = {
  'ley': ['norma', 'reglamento', 'código', 'decreto'],
  'artículo': ['art', 'artículo'],
  'código': ['código', 'ley', 'norma'],
  'derecho': ['derechos', 'garantía', 'garantías'],
  'obligación': ['obligaciones', 'deber', 'deberes'],
  'responsabilidad': ['responsabilidades', 'culpa', 'culpabilidad'],
  'procedimiento': ['procedimientos', 'trámite', 'trámites'],
  'registro': ['registros', 'inscripción', 'inscripciones'],
  'documento': ['documentos', 'acta', 'actas'],
  'oficial': ['oficiales', 'público', 'públicos'],
  'civil': ['civiles', 'civil'],
  'penal': ['penales', 'penal'],
  'administrativo': ['administrativos', 'administrativa'],
  'constitucional': ['constitucionales', 'constitucional'],
  'federal': ['federales', 'federal'],
  'estatal': ['estatales', 'estatal'],
  'municipal': ['municipales', 'municipal']
};

// Función para expandir sinónimos
function expandSynonyms(terms: string[]): string[] {
  const expanded: string[] = [];
  
  for (const term of terms) {
    expanded.push(term);
    const synonyms = legalSynonyms[term.toLowerCase()];
    if (synonyms) {
      expanded.push(...synonyms);
    }
  }
  
  return [...new Set(expanded)]; // Eliminar duplicados
}

// Función mejorada de preprocesamiento
function preprocessQuery(query: string): string {
  console.log('🔍 Preprocesando query original:', query);
  
  // Paso 1: Limpieza básica
  let processed = query
    .toLowerCase()
    .replace(/[¿?¡!.,;:()\[\]{}\-_=+<>"'`~@#$%^&*/\\]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  console.log('🔍 Después de limpieza:', processed);
  
  // Paso 2: Filtrar stopwords (pero conservar términos legales importantes)
  const legalTerms = ['artículo', 'ley', 'código', 'reglamento', 'decreto', 'norma', 'cláusula', 'sección', 'capítulo', 'título'];
  processed = processed.filter(word => 
    !legalStopwords.includes(word) || legalTerms.includes(word)
  );
  
  console.log('🔍 Después de filtrar stopwords:', processed);
  
  // Paso 3: Aplicar stemming
  const stemmed = processed.map(word => stemSpanishWord(word));
  console.log('🔍 Después de stemming:', stemmed);
  
  // Paso 4: Expandir sinónimos
  const withSynonyms = expandSynonyms(stemmed);
  console.log('🔍 Con sinónimos:', withSynonyms);
  
  // Paso 5: Construir query para to_tsquery con operadores de proximidad
  const finalQuery = withSynonyms.join(' & ');
  
  console.log('🔍 Query final para to_tsquery:', finalQuery);
  return finalQuery;
}

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    // Preprocesar la query (puedes dejar el preprocesamiento si lo deseas, o solo usar la query tal cual)
    // const processedQuery = preprocessQuery(query);
    // Para la función básica, solo usamos la query original
    const processedQuery = query;

    const supabase = await createClient();
    // Llamar a la función básica BM25
    const { data: results, error } = await supabase.rpc('search_chunks_bm25', {
      search_query: processedQuery,
      result_limit: limit
    });

    if (error) {
      console.error('❌ Error en búsqueda BM25:', error);
      return NextResponse.json({
        success: false,
        error: 'Error en búsqueda BM25',
        details: error.message
      });
    }

    // Procesar resultados
    const processedResults = results?.map((chunk: any) => ({
      chunk_id: chunk.chunk_id,
      content: chunk.chunk_text,
      char_count: chunk.char_count,
      document_id: chunk.document_id,
      source: chunk.source,
      article_number: chunk.article_number,
      rank_score: chunk.rank_score
    })) || [];

    return NextResponse.json({
      success: true,
      query,
      results: processedResults,
      count: processedResults.length,
      method: 'bm25_basic',
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