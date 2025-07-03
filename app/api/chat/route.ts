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
    
    const { data, error } = await supabase.rpc('search_chunks_bm25_improved', {
      search_query: query,
      result_limit: limit
    });

    if (error) {
      console.error('Error en búsqueda BM25:', error);
      return [];
    }

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
      chunk_text: chunk.chunk_text,
      char_count: chunk.char_count,
      document_id: chunk.section_id,
      source: chunk.legal_document_name || 'Documento legal',
      legal_document_name: chunk.legal_document_name,
      article_number: chunk.article_number,
      similarity_score: chunk.similarity_score,
      content: chunk.chunk_text
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
    
    const systemPrompt = `Eres un asistente legal especializado en derecho mexicano. 
    
Tu tarea es responder preguntas legales usando ÚNICAMENTE la información proporcionada en el contexto. 

INSTRUCCIONES IMPORTANTES:
1. Usa SOLO la información del contexto para responder
2. Si el contexto no contiene información relevante para la pregunta, indícalo claramente
3. Cita artículos específicos cuando sea posible
4. Mantén un tono profesional y técnico
5. Organiza tu respuesta de manera clara y estructurada
6. NO inventes información que no esté en el contexto

CONTEXTO LEGAL:
${context}

PREGUNTA DEL USUARIO:
${query}

RESPUESTA:
`;

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

    // Ejecutar búsquedas en paralelo
    const [bm25Results, vectorResults] = await Promise.all([
      searchDocumentsBM25(finalQuery, 10),
      searchDocumentsVectorial(finalQuery, 10)
    ]);

    console.log('📊 Resultados obtenidos:');
    console.log(`- BM25: ${bm25Results.length} documentos`);
    console.log(`- Vectorial: ${vectorResults.length} documentos`);

    // Combinar y deduplicar resultados
    const allResults = [...bm25Results, ...vectorResults];
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.chunk_id === result.chunk_id)
    );

    // Ordenar por score
    uniqueResults.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));

    // Tomar los mejores resultados
    const topResults = uniqueResults.slice(0, 15);

    // Extraer artículos referenciados
    const referencedArticles = extractReferencedArticles(vectorResults, bm25Results);
    console.log(`📋 Artículos referenciados encontrados: ${referencedArticles.length}`);

    // Construir contexto
    let context = '';
    if (topResults.length > 0) {
      context = topResults.map((doc, index) => {
        return `=== ${doc.source}${doc.article_number ? ` - Artículo ${doc.article_number}` : ''} ===\n${doc.content}\n`;
      }).join('\n');
    }

    // Generar respuesta
    let response: string;
    if (context.trim()) {
      response = await generateResponse(query, context);
    } else {
      response = 'No encontré información relevante en los documentos legales disponibles para responder tu pregunta. Te sugiero reformular la consulta o consultar directamente con un profesional del derecho.';
    }

    // Guardar historial
    const documentsUsed = topResults.map(doc => doc.source);
    await saveChatHistory(query, response, documentsUsed);

    return NextResponse.json({
      success: true,
      response,
      documents: topResults,
      referenced_articles: referencedArticles,
      search_stats: {
        bm25_results: bm25Results.length,
        vector_results: vectorResults.length,
        total_unique: uniqueResults.length,
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