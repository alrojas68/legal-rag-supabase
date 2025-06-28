import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Función para buscar documentos similares usando RPC (vectorial)
async function searchSimilarDocuments(query: string, supabase: any, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 Buscando documentos similares para:', query);
    
    // Obtener embedding de la consulta
    const queryEmbedding = await getEmbeddings(query);
    console.log('✅ Embedding generado, longitud:', queryEmbedding.length);
    
    // DIAGNÓSTICO: Verificar qué documentos existen
    console.log('🔍 DIAGNÓSTICO: Verificando documentos en la base de datos...');
    const { data: allDocuments, error: docsError } = await supabase
      .from('documents')
      .select('document_id, source')
      .limit(20);
    
    if (docsError) {
      console.error('❌ Error al obtener documentos:', docsError);
    } else {
      console.log('📚 Documentos disponibles:', allDocuments?.map((d: any) => d.source) || []);
    }
    
    // DIAGNÓSTICO: Verificar embeddings
    console.log('🔍 DIAGNÓSTICO: Verificando embeddings...');
    const { data: embeddingsCount, error: embError } = await supabase
      .from('embeddings')
      .select('vector_id', { count: 'exact' });
    
    if (embError) {
      console.error('❌ Error al contar embeddings:', embError);
    } else {
      console.log(`📊 Total de embeddings: ${embeddingsCount?.length || 0}`);
    }
    
    // DIAGNÓSTICO: Buscar específicamente por "condominio"
    console.log('🔍 DIAGNÓSTICO: Buscando chunks que contengan "condominio"...');
    const { data: condominioChunks, error: condError } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, documents!inner(source)')
      .ilike('chunk_text', '%condominio%')
      .limit(5);
    
    if (condError) {
      console.error('❌ Error al buscar condominio:', condError);
    } else {
      console.log(`📄 Chunks con "condominio": ${condominioChunks?.length || 0}`);
      if (condominioChunks && condominioChunks.length > 0) {
        console.log('📄 Ejemplos de chunks con condominio:');
        condominioChunks.slice(0, 2).forEach((chunk: any, idx: number) => {
          console.log(`  ${idx + 1}. ${chunk.documents.source}: ${chunk.chunk_text.substring(0, 200)}...`);
        });
      }
    }
    
    // Buscar documentos similares usando la función RPC
    console.log('🔍 Ejecutando match_documents RPC...');
    const { data: matchingDocuments, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: limit
    });

    if (error) {
      console.error('❌ Error en búsqueda RPC:', error);
      throw error;
    }

    console.log(`📊 Encontrados ${matchingDocuments?.length || 0} documentos similares`);
    
    // DIAGNÓSTICO: Mostrar los documentos encontrados
    if (matchingDocuments && matchingDocuments.length > 0) {
      console.log('📄 Documentos encontrados por RPC:');
      matchingDocuments.forEach((doc: any, idx: number) => {
        console.log(`  ${idx + 1}. ${doc.source} (score: ${doc.similarity_score?.toFixed(4)})`);
        console.log(`     Document ID: ${doc.document_id || 'N/A'}`);
        console.log(`     Chunk ID: ${doc.chunk_id || 'N/A'}`);
        console.log(`     Legal Document Name: ${doc.legal_document_name || 'N/A'}`);
        if (doc.content) {
          console.log(`     Contenido: ${doc.content.substring(0, 300)}...`);
        } else if (doc.chunk_text) {
          console.log(`     Chunk Text: ${doc.chunk_text.substring(0, 300)}...`);
        } else {
          console.log(`     ⚠️ NO HAY CONTENIDO DISPONIBLE`);
        }
        console.log('     ' + '-'.repeat(50));
      });
    } else {
      console.log('⚠️ No se encontraron documentos similares');
    }
    
    return matchingDocuments || [];
    
  } catch (error) {
    console.error('Error al buscar documentos similares:', error);
    return [];
  }
}

// NUEVA FUNCIÓN: Buscar documentos usando BM25
async function searchDocumentsBM25(query: string, supabase: any, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 BM25: Buscando documentos para:', query);
    // Llamar al endpoint /api/search-bm25 usando fetch con URL absoluta
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/search-bm25`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Error en búsqueda BM25 vía API:', result.error || result.details);
      return [];
    }
    console.log(`✅ BM25 vía API: Resultados procesados: ${result.results?.length || 0}`);
    return result.results || [];
  } catch (error) {
    console.error('❌ Error general en BM25 vía API:', error);
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

CONTEXTO DISPONIBLE:
${context}

PREGUNTA DEL USUARIO:
${query}

RESPUESTA:`;

    // DIAGNÓSTICO: Mostrar el prompt completo
    console.log('🔍 DIAGNÓSTICO: Prompt completo que se enviará a Gemini:');
    console.log('='.repeat(80));
    console.log(systemPrompt);
    console.log('='.repeat(80));

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error al generar respuesta:', error);
    return 'Hubo un error al procesar tu consulta. Por favor, intenta de nuevo.';
  }
}

// NUEVA FUNCIÓN: Extraer artículos referenciados
function extractReferencedArticles(vectorResults: any[], bm25Results: any[]): any[] {
  const articles = new Map<string, any>();
  
  // Función para extraer artículos de un texto
  const extractArticlesFromText = (text: string, source: string, method: string, score: number) => {
    // Patrón para encontrar "ARTÍCULO N" o "Artículo N"
    const articleRegex = /art[íi]culo\s+(\d+)/gi;
    let match;
    
    while ((match = articleRegex.exec(text)) !== null) {
      const articleNum = match[1];
      const key = `${source}-${articleNum}`;
      
      if (!articles.has(key)) {
        articles.set(key, {
          document: source,
          article: articleNum,
          methods: [],
          scores: []
        });
      }
      
      const article = articles.get(key);
      if (!article.methods.includes(method)) {
        article.methods.push(method);
      }
      article.scores.push(score);
    }
  };
  
  // Procesar resultados vectoriales
  vectorResults.forEach(doc => {
    const content = doc.chunk_text || doc.content || '';
    const source = doc.legal_document_name || doc.source || 'Documento legal';
    extractArticlesFromText(content, source, 'Vectorial', doc.similarity_score || 0);
  });
  
  // Procesar resultados BM25
  bm25Results.forEach(doc => {
    const content = doc.content || '';
    const source = doc.source || 'Documento legal';
    extractArticlesFromText(content, source, 'BM25', doc.rank_score || 0);
  });
  
  // Convertir a array y ordenar por documento y número de artículo
  return Array.from(articles.values()).sort((a, b) => {
    // Primero: ordenar por doble match (vectorial + BM25)
    const aHasDoubleMatch = a.methods.includes('Vectorial') && a.methods.includes('BM25');
    const bHasDoubleMatch = b.methods.includes('Vectorial') && b.methods.includes('BM25');
    
    if (aHasDoubleMatch && !bHasDoubleMatch) return -1;
    if (!aHasDoubleMatch && bHasDoubleMatch) return 1;
    
    // Segundo: ordenar por score más alto (descendente)
    const aMaxScore = Math.max(...a.scores);
    const bMaxScore = Math.max(...b.scores);
    
    if (aMaxScore !== bMaxScore) {
      return bMaxScore - aMaxScore; // Descendente
    }
    
    // Tercero: si tienen el mismo score, ordenar por documento y número de artículo
    if (a.document !== b.document) {
      return a.document.localeCompare(b.document);
    }
    return parseInt(a.article) - parseInt(b.article);
  });
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

    console.log('🚀 Procesando consulta:', query);

    // Crear cliente de Supabase
    const supabase = await createClient();

    // --- NUEVO: Buscar si la consulta contiene "artículo N" ---
    const articuloRegex = /art[íi]culo\s+(\d+)/i;
    const match = query.match(articuloRegex);
    let exactChunk = null;
    if (match) {
      const articuloNum = match[1];
      // Buscar chunk que contenga exactamente "artículo N"
      const { data: exactChunks, error: exactError } = await supabase
        .from('chunks')
        .select('chunk_id, chunk_text, section_id')
        .ilike('chunk_text', `%artículo ${articuloNum}%`)
        .limit(1);
      if (exactError) {
        console.error('Error en búsqueda exacta de artículo:', exactError);
      } else if (exactChunks && exactChunks.length > 0) {
        exactChunk = exactChunks[0];
        console.log('✅ Chunk exacto encontrado para artículo', articuloNum);
      } else {
        console.log('❌ No se encontró chunk exacto para artículo', articuloNum);
      }
    }

    // NUEVO: Ejecutar ambas búsquedas en paralelo
    console.log('🔄 Ejecutando búsquedas vectorial y BM25 en paralelo...');
    const [vectorResults, bm25Results] = await Promise.all([
      searchSimilarDocuments(query, supabase, 10),
      searchDocumentsBM25(query, supabase, 10)
    ]);

    console.log(`📊 Resultados obtenidos:`);
    console.log(`   - Vectorial: ${vectorResults.length} documentos`);
    console.log(`   - BM25: ${bm25Results.length} documentos`);

    // --- NUEVO: Si hay chunk exacto, ponerlo al principio del contexto vectorial ---
    let contextDocs = vectorResults;
    if (exactChunk) {
      // Evitar duplicados si el chunk ya viene en los resultados semánticos
      contextDocs = [
        { chunk_id: exactChunk.chunk_id, chunk_text: exactChunk.chunk_text, source: 'Búsqueda exacta', legal_document_name: '', content: exactChunk.chunk_text },
        ...vectorResults.filter(doc => doc.chunk_id !== exactChunk.chunk_id)
      ];
    }

    // NUEVO: Generar respuesta solo con resultados vectoriales (como antes)
    let response = '';
    if (contextDocs && contextDocs.length > 0) {
      // Paso 2: Combinar los documentos relevantes en un solo contexto
      console.log('🔍 DIAGNÓSTICO: Construyendo contexto...');
      const context = contextDocs
        .map((doc: any, idx: number) => {
          const source = doc.legal_document_name || doc.source || 'Documento legal';
          // Intentar usar chunk_text primero, luego content
          const content = doc.chunk_text || doc.content || '';
          return `=== ${source} ===\n${content}\n=== FIN ${source} ===`;
        })
        .join('\n\n');

      console.log('📄 Contexto construido con', contextDocs.length, 'documentos');
      console.log(`📊 Longitud total del contexto: ${context.length} caracteres`);

      // Paso 3: Generar respuesta usando el contexto
      response = await generateResponse(query, context);
    } else {
      response = 'No encontré información relevante en los documentos legales disponibles para responder tu pregunta. Te sugiero reformular la consulta o consultar directamente con un profesional del derecho.';
    }

    // NUEVO: Generar respuesta combinada usando ambos métodos
    let combinedResponse = '';
    if (vectorResults.length > 0 || bm25Results.length > 0) {
      console.log('🔄 Generando respuesta combinada...');
      
      // Combinar y deduplicar resultados de ambos métodos
      const allDocs = [...vectorResults, ...bm25Results];
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.chunk_id === doc.chunk_id)
      );
      
      // Ordenar por relevancia (vectorial primero, luego BM25)
      const sortedDocs = uniqueDocs.sort((a, b) => {
        const aScore = a.similarity_score || 0;
        const bScore = b.similarity_score || 0;
        return bScore - aScore;
      });
      
      // Tomar los mejores 15 documentos combinados
      const bestDocs = sortedDocs.slice(0, 15);
      
      console.log(`📊 Respuesta combinada: ${bestDocs.length} documentos únicos`);
      
      // Construir contexto combinado
      const combinedContext = bestDocs
        .map((doc: any, idx: number) => {
          const source = doc.legal_document_name || doc.source || 'Documento legal';
          const content = doc.chunk_text || doc.content || '';
          const method = doc.similarity_score ? 'Vectorial' : 'BM25';
          const score = doc.similarity_score || doc.rank_score;
          return `=== ${source} (${method}, Score: ${score?.toFixed(4)}) ===\n${content}\n=== FIN ${source} ===`;
        })
        .join('\n\n');

      // Generar respuesta combinada
      combinedResponse = await generateResponse(query, combinedContext);
    } else {
      combinedResponse = 'No encontré información relevante en los documentos legales disponibles para responder tu pregunta. Te sugiero reformular la consulta o consultar directamente con un profesional del derecho.';
    }

    // NUEVO: Extraer artículos referenciados
    const referencedArticles = extractReferencedArticles(vectorResults, bm25Results);
    console.log(`📋 Artículos referenciados encontrados: ${referencedArticles.length}`);

    // Guardar historial
    try {
      await supabase
        .from('chat_history')
        .insert({
          query: query,
          response: response,
          documents_used: contextDocs.map((doc: any) => doc.document_id || doc.chunk_id),
          session_id: req.headers.get('x-session-id') || 'default-session',
          created_at: new Date().toISOString()
        });
    } catch (historyError) {
      console.warn('Error al guardar historial:', historyError);
    }

    // NUEVO: Devolver respuesta comparativa
    return NextResponse.json({
      success: true,
      response: response,
      combined_response: combinedResponse,
      query: query,
      timestamp: new Date().toISOString(),
      // NUEVO: Resultados comparativos
      comparison: {
        vector_results: {
          count: vectorResults.length,
          documents: vectorResults.map((doc: any) => ({
            chunk_id: doc.chunk_id,
            document_id: doc.document_id,
            source: doc.source,
            content: doc.content || doc.chunk_text,
            similarity_score: doc.similarity_score
          }))
        },
        bm25_results: {
          count: bm25Results.length,
          documents: bm25Results.map((doc: any) => ({
            chunk_id: doc.chunk_id,
            document_id: doc.document_id,
            source: doc.source,
            content: doc.content,
            rank_score: doc.rank_score
          }))
        }
      },
      // NUEVO: Artículos referenciados
      referenced_articles: referencedArticles
    });

  } catch (error) {
    console.error('Error en el endpoint de chat:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    }, { status: 500 });
  }
} 