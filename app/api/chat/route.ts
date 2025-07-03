import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Tipos
interface Document {
  document_id: string;
  source: string;
  legal_document_name?: string;
  content?: string;
  similarity_score?: number;
  chunk_id?: string;
  article_number?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Configuración
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY no está configurada');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Variables de entorno de Supabase requeridas');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Función para buscar documentos usando BM25
async function searchDocumentsBM25(query: string, limit: number = 10): Promise<Document[]> {
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

// Función para buscar documentos usando embeddings
async function searchDocumentsVectorial(query: string, limit: number = 10): Promise<Document[]> {
  try {
    console.log('🔍 Vectorial: Buscando documentos para:', query);
    
    const queryEmbedding = await getEmbeddings(query);
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: limit
    });

    if (error) {
      console.error('Error en búsqueda vectorial:', error);
      return [];
    }

    const processedResults = data.map((chunk: any) => ({
      chunk_id: chunk.chunk_id,
      chunk_text: chunk.content, // Usar content que viene de la función match_documents
      char_count: chunk.char_count || 0,
      document_id: chunk.document_id,
      source: chunk.legal_document_name || 'Documento legal',
      legal_document_name: chunk.legal_document_name,
      article_number: chunk.article_number,
      similarity_score: chunk.similarity_score,
      content: chunk.content // Usar content que viene de la función match_documents
    }));

    console.log(`✅ Vectorial: ${processedResults.length} resultados encontrados`);
    return processedResults;
  } catch (error) {
    console.error('Error en búsqueda vectorial:', error);
    return [];
  }
}

// Función para generar respuesta usando Gemini
async function generateResponse(query: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = `Eres un asistente legal especializado en derecho mexicano.\n\nTu tarea es responder preguntas legales usando ÚNICAMENTE la información proporcionada en el contexto.\n\nINSTRUCCIONES IMPORTANTES:\n1. Usa SOLO la información del contexto para responder\n2. Si el contexto no contiene información relevante para la pregunta, indícalo claramente\n3. Cita SIEMPRE el nombre del documento y el número de artículo de donde proviene la información (por ejemplo: 'según el Artículo 6 de la Ley de Sociedad de Convivencia para la Ciudad de México')\n4. Mantén un tono profesional y técnico\n5. Organiza tu respuesta de manera clara y estructurada\n6. NO inventes información que no esté en el contexto\n\nCONTEXTO LEGAL:\n${context}\n\nPREGUNTA DEL USUARIO:\n${query}\n\nRESPUESTA:\n`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    
    console.log('✅ Respuesta generada exitosamente');
    return response;
  } catch (error) {
    console.error('Error al generar respuesta:', error);
    throw error;
  }
}

// Función para extraer artículos referenciados
function extractReferencedArticles(vectorResults: Document[], bm25Results: Document[]): any[] {
  const articles = new Map<string, any>();
  
  const extractArticlesFromText = (text: string, source: string, method: string, score: number) => {
    // Buscar patrones de artículos (Artículo X, Art. X, etc.)
    const articlePatterns = [
      /artículo\s+(\d+)/gi,
      /art\.\s*(\d+)/gi,
      /artículo\s+(\d+[a-z]?)/gi,
      /art\.\s*(\d+[a-z]?)/gi
    ];
    
    articlePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const articleNumber = match.replace(/artículo\s+|art\.\s*/gi, '').trim();
          const key = `${source}-${articleNumber}`;
          
          if (!articles.has(key)) {
            articles.set(key, {
              source,
              article_number: articleNumber,
              methods: [],
              highest_score: 0
            });
          }
          
          const article = articles.get(key);
          if (!article.methods.includes(method)) {
            article.methods.push(method);
          }
          if (score > article.highest_score) {
            article.highest_score = score;
          }
        });
      }
    });
  };
  
  // Extraer de resultados vectoriales
  vectorResults.forEach(doc => {
    if (doc.content) {
      extractArticlesFromText(doc.content, doc.source, 'vectorial', doc.similarity_score || 0);
    }
  });
  
  // Extraer de resultados BM25
  bm25Results.forEach(doc => {
    if (doc.content) {
      extractArticlesFromText(doc.content, doc.source, 'bm25', doc.similarity_score || 0);
    }
  });
  
  return Array.from(articles.values());
}

// Función para guardar historial de chat
async function saveChatHistory(query: string, response: string, documentsUsed: string[]): Promise<void> {
  try {
    // Convertir nombres de documentos a UUIDs (usar un UUID por defecto si no tenemos el real)
    const documentIds = documentsUsed.length > 0 ? ['00000000-0000-0000-0000-000000000000'] : [];
    
    const { error } = await supabase
      .from('chat_history')
      .insert({
        query,
        response,
        documents_used: documentIds,
        session_id: 'default-session'
      });

    if (error) {
      console.error('Error al guardar historial:', error);
    } else {
      console.log('✅ Historial guardado exitosamente');
    }
  } catch (error) {
    console.error('Error al guardar historial:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, query } = body;
    
    // Aceptar tanto el formato nuevo (messages) como el antiguo (query)
    let finalQuery: string;
    if (query) {
      finalQuery = query;
    } else if (messages && messages.length > 0) {
      finalQuery = messages[messages.length - 1].content;
    } else {
      return NextResponse.json({
        error: 'Se requiere una consulta (query) o mensajes',
        success: false
      }, { status: 400 });
    }

    console.log('🚀 Procesando consulta:', finalQuery);
    console.log('🔄 Ejecutando búsquedas...');

    // Ejecutar búsquedas secuencialmente para debug
    console.log('🔍 Ejecutando BM25...');
    const bm25Results = await searchDocumentsBM25(finalQuery, 10);
    console.log('🔍 Ejecutando Vectorial...');
    const vectorResults = await searchDocumentsVectorial(finalQuery, 10);

    console.log('📊 Resultados obtenidos:');
    console.log(`- BM25: ${bm25Results.length} documentos`);
    console.log(`- Vectorial: ${vectorResults.length} documentos`);

    // Extraer artículos referenciados por método
    const referencedArticles = extractReferencedArticles(vectorResults, bm25Results);
    console.log(`📋 Artículos referenciados encontrados: ${referencedArticles.length}`);

    // Mezclar ambos resultados (sin deduplicar)
    const allResults = [...bm25Results, ...vectorResults];
    // Ordenar por score descendente (puedes ajustar el criterio si quieres)
    allResults.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
    // Tomar los mejores 15
    const topResults = allResults.slice(0, 15);

    // Construir contextos separados
    const contextVectorial = vectorResults.map(doc => `=== Documento: ${doc.source}${doc.article_number ? ` | Artículo: ${doc.article_number}` : ''} ===\n${doc.content}\n`).join('\n');
    const contextBM25 = bm25Results.map(doc => `=== Documento: ${doc.source}${doc.article_number ? ` | Artículo: ${doc.article_number}` : ''} ===\n${doc.content}\n`).join('\n');
    const contextCombined = topResults.map(doc => `=== Documento: ${doc.source}${doc.article_number ? ` | Artículo: ${doc.article_number}` : ''} ===\n${doc.content}\n`).join('\n');

    // Generar respuestas por separado
    let responseVectorial = '';
    let responseBM25 = '';
    let responseCombined = '';
    if (contextVectorial.trim()) {
      responseVectorial = await generateResponse(finalQuery, contextVectorial);
    } else {
      responseVectorial = 'No se encontró información relevante en la búsqueda vectorial.';
    }
    if (contextBM25.trim()) {
      responseBM25 = await generateResponse(finalQuery, contextBM25);
    } else {
      responseBM25 = 'No se encontró información relevante en la búsqueda BM25.';
    }
    if (contextCombined.trim()) {
      responseCombined = await generateResponse(finalQuery, contextCombined);
    } else {
      responseCombined = 'No se encontró información relevante en la búsqueda combinada.';
    }

    // Agrupar artículos referenciados
    const articlesVectorial = extractReferencedArticles(vectorResults, []);
    const articlesBM25 = extractReferencedArticles([], bm25Results);
    // Map para fácil búsqueda
    const key = (a: any) => `${a.source}||${a.article_number}`;
    const setVectorial = new Set(articlesVectorial.map(key));
    const setBM25 = new Set(articlesBM25.map(key));
    // En ambos métodos
    const articlesBoth = articlesVectorial.filter(a => setBM25.has(key(a)));
    // Solo vectorial
    const articlesOnlyVectorial = articlesVectorial.filter(a => !setBM25.has(key(a)));
    // Solo BM25
    const articlesOnlyBM25 = articlesBM25.filter(a => !setVectorial.has(key(a)));

    // Guardar historial solo de la respuesta combinada
    const documentsUsed = topResults.map(doc => doc.source);
    await saveChatHistory(finalQuery, responseCombined, documentsUsed);

    return NextResponse.json({
      success: true,
      response_vectorial: responseVectorial,
      response_bm25: responseBM25,
      response_combined: responseCombined,
      bm25_results: bm25Results,
      vectorial_results: vectorResults,
      mixed_context: topResults,
      referenced_articles: {
        both: articlesBoth,
        only_vectorial: articlesOnlyVectorial,
        only_bm25: articlesOnlyBM25
      },
      search_stats: {
        bm25_results: bm25Results.length,
        vector_results: vectorResults.length,
        final_results: topResults.length
      }
    });

  } catch (error) {
    console.error('Error en endpoint de chat:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 