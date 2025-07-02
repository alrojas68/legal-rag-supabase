import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  searchWithBM25Improved, 
  searchWithEmbeddings, 
  searchHybridComplete,
  saveChatHistory 
} from '@/lib/db/queries';

// Tipos
interface Document {
  document_id: string;
  source: string;
  legal_document_name?: string;
  content?: string;
  similarity_score?: number;
  chunk_id?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Configuración
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

// NUEVA FUNCIÓN: Buscar documentos usando Drizzle BM25
async function searchDocumentsBM25Drizzle(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 BM25 Drizzle: Buscando documentos para:', query);
    
    const results = await searchWithBM25Improved(query, limit, 1.2, 0.75);
    
    // Convertir a formato compatible
    const processedResults = results.map((chunk: any) => ({
      chunk_id: chunk.chunkId,
      chunk_text: chunk.chunkText,
      char_count: chunk.charCount,
      document_id: chunk.sectionId, // Nota: esto es sectionId
      source: chunk.legalDocumentName || 'Documento legal',
      legal_document_name: chunk.legalDocumentName,
      article_number: chunk.articleNumber,
      similarity_score: chunk.bm25Score,
      content: chunk.chunkText
    }));
    
    console.log(`✅ BM25 Drizzle: ${processedResults.length} resultados encontrados`);
    return processedResults;
  } catch (error) {
    console.error('❌ Error en BM25 Drizzle:', error);
    return [];
  }
}

// NUEVA FUNCIÓN: Buscar documentos usando Drizzle Vectorial
async function searchDocumentsVectorialDrizzle(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 Vectorial Drizzle: Buscando documentos para:', query);
    
    const queryEmbedding = await getEmbeddings(query);
    const results = await searchWithEmbeddings(queryEmbedding, limit);
    
    // Convertir a formato compatible
    const processedResults = results.map((chunk: any) => ({
      chunk_id: chunk.chunkId,
      chunk_text: chunk.chunkText,
      char_count: chunk.charCount,
      document_id: chunk.sectionId, // Nota: esto es sectionId
      source: chunk.legalDocumentName || 'Documento legal',
      legal_document_name: chunk.legalDocumentName,
      article_number: chunk.articleNumber,
      similarity_score: chunk.similarityScore,
      content: chunk.chunkText
    }));
    
    console.log(`✅ Vectorial Drizzle: ${processedResults.length} resultados encontrados`);
    return processedResults;
  } catch (error) {
    console.error('❌ Error en Vectorial Drizzle:', error);
    return [];
  }
}

// NUEVA FUNCIÓN: Búsqueda híbrida con Drizzle
async function searchDocumentsHybridDrizzle(query: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 Híbrida Drizzle: Buscando documentos para:', query);
    
    const queryEmbedding = await getEmbeddings(query);
    const results = await searchHybridComplete(query, queryEmbedding, 30, limit);
    
    // Convertir a formato compatible
    const processedResults = results.map((chunk: any) => ({
      chunk_id: chunk.chunkId,
      chunk_text: chunk.chunkText,
      char_count: chunk.charCount,
      document_id: chunk.sectionId, // Nota: esto es sectionId
      source: chunk.legalDocumentName || 'Documento legal',
      legal_document_name: chunk.legalDocumentName,
      article_number: chunk.articleNumber,
      similarity_score: chunk.combinedScore || chunk.bm25Score,
      content: chunk.chunkText
    }));
    
    console.log(`✅ Híbrida Drizzle: ${processedResults.length} resultados encontrados`);
    return processedResults;
  } catch (error) {
    console.error('❌ Error en Híbrida Drizzle:', error);
    return [];
  }
}

// Función para generar respuesta usando Gemini
async function generateResponse(query: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // DIAGNÓSTICO: Mostrar el contexto completo que se está enviando
    console.log('🔍 DIAGNÓSTICO: Contexto que se enviará al modelo:');
    console.log('='.repeat(80));
    console.log('CONTEXTO COMPLETO:');
    console.log(context);
    console.log('='.repeat(80));
    console.log(`📊 Longitud del contexto: ${context.length} caracteres`);
    console.log(`📄 Número de documentos en contexto: ${(context.match(/=== .* ===/g) || []).length}`);
    
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
function extractReferencedArticles(vectorResults: any[], bm25Results: any[]): any[] {
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
              article_number: articleNumber,
              source: source,
              method: method,
              score: score,
              context: text.substring(Math.max(0, text.indexOf(match) - 100), text.indexOf(match) + 200)
            });
          }
        });
      }
    });
  };
  
  // Extraer de resultados vectoriales
  vectorResults.forEach(doc => {
    if (doc.content) {
      extractArticlesFromText(doc.content, doc.source, 'Vectorial', doc.similarity_score);
    }
  });
  
  // Extraer de resultados BM25
  bm25Results.forEach(doc => {
    if (doc.content) {
      extractArticlesFromText(doc.content, doc.source, 'BM25', doc.similarity_score);
    }
  });
  
  return Array.from(articles.values()).sort((a, b) => b.score - a.score);
}

export async function POST(req: NextRequest) {
  try {
    const { messages, query } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    console.log('🚀 Procesando consulta con Drizzle:', query);

    // NUEVO: Ejecutar búsquedas con Drizzle en paralelo
    console.log('🔄 Ejecutando búsquedas con Drizzle...');
    const [bm25Results, vectorResults, hybridResults] = await Promise.all([
      searchDocumentsBM25Drizzle(query, 10),
      searchDocumentsVectorialDrizzle(query, 10),
      searchDocumentsHybridDrizzle(query, 10)
    ]);

    console.log(`📊 Resultados obtenidos con Drizzle:`);
    console.log(`   - BM25: ${bm25Results.length} documentos`);
    console.log(`   - Vectorial: ${vectorResults.length} documentos`);
    console.log(`   - Híbrida: ${hybridResults.length} documentos`);

    // Usar resultados híbridos como principales (mejor combinación)
    let contextDocs = hybridResults;
    if (hybridResults.length === 0) {
      // Fallback a BM25 si no hay resultados híbridos
      contextDocs = bm25Results;
    }

    // Generar respuesta
    let response = '';
    if (contextDocs && contextDocs.length > 0) {
      console.log('🔍 Construyendo contexto con Drizzle...');
      const context = contextDocs
        .map((doc: any, idx: number) => {
          const source = doc.legal_document_name || doc.source || 'Documento legal';
          const content = doc.chunk_text || doc.content || '';
          const score = doc.similarity_score?.toFixed(4) || 'N/A';
          return `=== ${source} (Score: ${score}) ===\n${content}\n=== FIN ${source} ===`;
        })
        .join('\n\n');

      console.log('📄 Contexto construido con', contextDocs.length, 'documentos');
      console.log(`📊 Longitud total del contexto: ${context.length} caracteres`);

      response = await generateResponse(query, context);
    } else {
      response = 'No encontré información relevante en los documentos legales disponibles para responder tu pregunta. Te sugiero reformular la consulta o consultar directamente con un profesional del derecho.';
    }

    // Extraer artículos referenciados
    const referencedArticles = extractReferencedArticles(vectorResults, bm25Results);
    console.log(`📋 Artículos referenciados encontrados: ${referencedArticles.length}`);

    // Guardar historial con Drizzle
    try {
      const sessionId = req.headers.get('x-session-id') || 'default-session';
      const documentsUsed = contextDocs.map((doc: any) => doc.chunk_id);
      
      await saveChatHistory(query, response, documentsUsed, sessionId);
      console.log('✅ Historial guardado con Drizzle');
    } catch (historyError) {
      console.warn('Error al guardar historial con Drizzle:', historyError);
    }

    // Devolver respuesta con Drizzle
    return NextResponse.json({
      success: true,
      response: response,
      query: query,
      timestamp: new Date().toISOString(),
      // Resultados de Drizzle
      drizzle_results: {
        bm25: {
          count: bm25Results.length,
          documents: bm25Results.map((doc: any) => ({
            chunk_id: doc.chunk_id,
            source: doc.source,
            content: doc.content,
            similarity_score: doc.similarity_score
          }))
        },
        vectorial: {
          count: vectorResults.length,
          documents: vectorResults.map((doc: any) => ({
            chunk_id: doc.chunk_id,
            source: doc.source,
            content: doc.content,
            similarity_score: doc.similarity_score
          }))
        },
        hibrida: {
          count: hybridResults.length,
          documents: hybridResults.map((doc: any) => ({
            chunk_id: doc.chunk_id,
            source: doc.source,
            content: doc.content,
            similarity_score: doc.similarity_score
          }))
        }
      },
      // Artículos referenciados
      referenced_articles: referencedArticles
    });

  } catch (error) {
    console.error('Error en el endpoint de chat con Drizzle:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    }, { status: 500 });
  }
} 