import { db } from './index';
import { chunks, documents, embeddings, sections, chatHistory } from './schema';
import { eq, desc, asc, sql, and, or, like, ilike } from 'drizzle-orm';
import type { Chunk, Document } from './schema';

// Tipo para resultados de búsqueda con score
type ChunkWithScore = Chunk & { 
  bm25Score?: number; 
  combinedScore?: number;
  similarityScore?: number;
};

// Función para búsqueda BM25 mejorada con parámetros ajustables
export async function searchWithBM25Improved(
  query: string, 
  limit: number = 30,
  k1: number = 1.2,
  b: number = 0.75
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda BM25 mejorada para:', query);
    console.log('🔍 Parámetros BM25 - k1:', k1, 'b:', b);
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId,
        // Score de BM25 con parámetros ajustables usando ts_rank_cd
        bm25Score: sql<number>`ts_rank_cd(
          to_tsvector('spanish', ${chunks.chunkText}), 
          plainto_tsquery('spanish', ${query}),
          ${k1},
          ${b}
        )`.as('bm25_score')
      })
      .from(chunks)
      .where(sql`to_tsvector('spanish', ${chunks.chunkText}) @@ plainto_tsquery('spanish', ${query})`)
      .orderBy(desc(sql`bm25_score`))
      .limit(limit);

    console.log(`📊 BM25 mejorado encontró ${results.length} resultados`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda BM25 mejorada:', error);
    return [];
  }
}

// Función para búsqueda BM25 con resaltado
export async function searchWithBM25Highlighted(
  query: string, 
  limit: number = 30,
  k1: number = 1.2,
  b: number = 0.75
): Promise<(ChunkWithScore & { highlightedText?: string })[]> {
  try {
    console.log('🔍 Ejecutando búsqueda BM25 con resaltado para:', query);
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId,
        // Score de BM25 con parámetros ajustables
        bm25Score: sql<number>`ts_rank_cd(
          to_tsvector('spanish', ${chunks.chunkText}), 
          plainto_tsquery('spanish', ${query}),
          ${k1},
          ${b}
        )`.as('bm25_score'),
        // Texto resaltado con ts_headline
        highlightedText: sql<string>`ts_headline(
          'spanish', 
          ${chunks.chunkText}, 
          plainto_tsquery('spanish', ${query}), 
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        )`.as('highlighted_text')
      })
      .from(chunks)
      .where(sql`to_tsvector('spanish', ${chunks.chunkText}) @@ plainto_tsquery('spanish', ${query})`)
      .orderBy(desc(sql`bm25_score`))
      .limit(limit);

    console.log(`📊 BM25 con resaltado encontró ${results.length} resultados`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda BM25 con resaltado:', error);
    return [];
  }
}

// Función para búsqueda BM25 con sinónimos
export async function searchWithBM25Synonyms(
  query: string, 
  limit: number = 30
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda BM25 con sinónimos para:', query);
    
    // Expandir query con sinónimos legales
    let expandedQuery = query;
    const synonyms = {
      'ley': '(ley | norma | reglamento | código | decreto)',
      'artículo': '(artículo | art)',
      'derecho': '(derecho | derechos | garantía | garantías)',
      'obligación': '(obligación | obligaciones | deber | deberes)',
      'responsabilidad': '(responsabilidad | responsabilidades | culpa | culpabilidad)',
      'procedimiento': '(procedimiento | procedimientos | trámite | trámites)',
      'registro': '(registro | registros | inscripción | inscripciones)',
      'documento': '(documento | documentos | acta | actas)',
      'oficial': '(oficial | oficiales | público | públicos)'
    };
    
    for (const [term, synonym] of Object.entries(synonyms)) {
      expandedQuery = expandedQuery.replace(new RegExp(term, 'gi'), synonym);
    }
    
    console.log('🔍 Query expandida con sinónimos:', expandedQuery);
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId,
        bm25Score: sql<number>`ts_rank(
          to_tsvector('spanish', ${chunks.chunkText}), 
          to_tsquery('spanish', ${expandedQuery})
        )`.as('bm25_score')
      })
      .from(chunks)
      .where(sql`to_tsvector('spanish', ${chunks.chunkText}) @@ to_tsquery('spanish', ${expandedQuery})`)
      .orderBy(desc(sql`bm25_score`))
      .limit(limit);

    console.log(`📊 BM25 con sinónimos encontró ${results.length} resultados`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda BM25 con sinónimos:', error);
    return [];
  }
}

// Función para búsqueda híbrida mejorada: BM25 + Embeddings
export async function searchHybridImproved(
  query: string, 
  queryEmbedding: number[], 
  bm25Limit: number = 30,
  finalLimit: number = 10,
  k1: number = 1.2,
  b: number = 0.75
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda híbrida mejorada...');
    console.log('🔍 Parámetros BM25 - k1:', k1, 'b:', b);
    
    // Paso 1: BM25 mejorado para obtener candidatos iniciales
    const bm25Results = await searchWithBM25Improved(query, bm25Limit, k1, b);
    
    if (bm25Results.length === 0) {
      console.log('⚠️ BM25 mejorado no encontró resultados');
      return [];
    }

    // Paso 2: Re-ranking con embeddings de los mejores BM25
    const chunkIds = bm25Results.map(chunk => chunk.chunkId);
    
    const hybridResults = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId,
        // Score combinado: BM25 mejorado + Similitud vectorial
        combinedScore: sql<number>`(
          COALESCE(ts_rank_cd(
            to_tsvector('spanish', ${chunks.chunkText}), 
            plainto_tsquery('spanish', ${query}),
            ${k1},
            ${b}
          ), 0) * 0.3 + 
          COALESCE(1 - (${embeddings.embedding}::vector <=> ${queryEmbedding}::vector), 0) * 0.7
        )`.as('combined_score')
      })
      .from(chunks)
      .innerJoin(embeddings, eq(chunks.chunkId, embeddings.chunkId))
      .where(sql`${chunks.chunkId} = ANY(${chunkIds})`)
      .orderBy(desc(sql`combined_score`))
      .limit(finalLimit);

    console.log(`📊 Búsqueda híbrida mejorada encontró ${hybridResults.length} resultados finales`);
    return hybridResults;
  } catch (error) {
    console.error('Error en búsqueda híbrida mejorada:', error);
    return [];
  }
}

// Función para búsqueda exacta de artículos
export async function searchExactArticle(articleNumber: string): Promise<Chunk | null> {
  try {
    console.log('🔍 Buscando artículo exacto:', articleNumber);
    
    const results = await db
      .select()
      .from(chunks)
      .where(ilike(chunks.chunkText, `%artículo ${articleNumber}%`))
      .limit(1);

    if (results.length > 0) {
      console.log('✅ Artículo exacto encontrado');
      return results[0];
    } else {
      console.log('❌ Artículo exacto no encontrado');
      return null;
    }
  } catch (error) {
    console.error('Error en búsqueda exacta de artículo:', error);
    return null;
  }
}

// Función para obtener documentos con sus chunks
export async function getDocumentsWithChunks(): Promise<Document[]> {
  try {
    const results = await db
      .select({
        documentId: documents.documentId,
        source: documents.source,
        publicationDate: documents.publicationDate,
        lastReformDate: documents.lastReformDate,
        jurisdiction: documents.jurisdiction,
        docType: documents.docType,
        createdAt: documents.createdAt,
        chunkCount: sql<number>`COUNT(${chunks.chunkId})`.as('chunk_count')
      })
      .from(documents)
      .leftJoin(sections, eq(documents.documentId, sections.documentId))
      .leftJoin(chunks, eq(sections.sectionId, chunks.sectionId))
      .groupBy(documents.documentId)
      .orderBy(desc(documents.createdAt));

    // Mapear el resultado para que coincida con el tipo Document
    return results.map(result => ({
      documentId: result.documentId,
      source: result.source,
      publicationDate: result.publicationDate,
      lastReformDate: result.lastReformDate,
      jurisdiction: result.jurisdiction,
      docType: result.docType,
      createdAt: result.createdAt
    }));
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return [];
  }
}

// Función para obtener estadísticas de la base de datos
export async function getDatabaseStats() {
  try {
    const [documentsCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    const [chunksCount] = await db.select({ count: sql<number>`count(*)` }).from(chunks);
    const [embeddingsCount] = await db.select({ count: sql<number>`count(*)` }).from(embeddings);

    return {
      documents: documentsCount.count,
      chunks: chunksCount.count,
      embeddings: embeddingsCount.count
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { documents: 0, chunks: 0, embeddings: 0 };
  }
}

// Función para guardar historial de chat
export async function saveChatHistory(
  query: string, 
  response: string, 
  documentsUsed: string[], 
  sessionId: string = 'default-session'
) {
  try {
    await db.insert(chatHistory).values({
      query,
      response,
      documentsUsed: documentsUsed as any, // JSONB
      sessionId,
      createdAt: new Date()
    });
    
    console.log('✅ Historial de chat guardado');
  } catch (error) {
    console.error('Error al guardar historial de chat:', error);
  }
}

// Función para obtener historial de chat por sesión
export async function getChatHistory(sessionId: string, limit: number = 50) {
  try {
    const results = await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.sessionId, sessionId))
      .orderBy(desc(chatHistory.createdAt))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Error al obtener historial de chat:', error);
    return [];
  }
}

// Función para obtener todos los documentos con estadísticas
export async function getAllDocumentsWithStats() {
  try {
    console.log('📚 Obteniendo documentos con estadísticas...');
    
    // Obtener documentos con chunks a través de sections
    const documentsWithChunks = await db
      .select({
        documentId: documents.documentId,
        source: documents.source,
        createdAt: documents.createdAt,
        publicationDate: documents.publicationDate,
        lastReformDate: documents.lastReformDate,
        jurisdiction: documents.jurisdiction,
        docType: documents.docType,
        chunkId: chunks.chunkId,
        charCount: chunks.charCount
      })
      .from(documents)
      .leftJoin(sections, eq(documents.documentId, sections.documentId))
      .leftJoin(chunks, eq(sections.sectionId, chunks.sectionId))
      .orderBy(desc(documents.createdAt));

    // Agrupar por documento
    const documentMap = new Map<string, any>();
    
    documentsWithChunks.forEach(row => {
      if (!documentMap.has(row.documentId)) {
        documentMap.set(row.documentId, {
          id: row.documentId,
          name: row.source,
          createdAt: row.createdAt,
          publicationDate: row.publicationDate,
          lastReformDate: row.lastReformDate,
          jurisdiction: row.jurisdiction,
          docType: row.docType,
          chunks: 0,
          totalCharacters: 0
        });
      }
      
      if (row.chunkId) {
        const doc = documentMap.get(row.documentId);
        doc.chunks++;
        doc.totalCharacters += row.charCount || 0;
      }
    });

    const processedDocuments = Array.from(documentMap.values());
    console.log(`📊 Procesados ${processedDocuments.length} documentos`);
    return processedDocuments;
  } catch (error) {
    console.error('Error al obtener documentos con estadísticas:', error);
    return [];
  }
}

// Función para búsqueda vectorial usando embeddings
export async function searchWithEmbeddings(
  queryEmbedding: number[], 
  limit: number = 10
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda vectorial...');
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId,
        // Calcular similitud coseno
        similarityScore: sql<number>`1 - (${chunks.chunkText} <=> ${JSON.stringify(queryEmbedding)}::vector)`.as('similarity_score')
      })
      .from(chunks)
      .innerJoin(embeddings, eq(chunks.chunkId, embeddings.chunkId))
      .orderBy(desc(sql`similarity_score`))
      .limit(limit);

    console.log(`📊 Búsqueda vectorial encontró ${results.length} resultados`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda vectorial:', error);
    return [];
  }
}

// Función para búsqueda híbrida completa: BM25 + Vectorial
export async function searchHybridComplete(
  query: string,
  queryEmbedding: number[],
  bm25Limit: number = 30,
  finalLimit: number = 10,
  bm25Weight: number = 0.6,
  vectorWeight: number = 0.4
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda híbrida completa...');
    
    // Paso 1: BM25
    const bm25Results = await searchWithBM25Improved(query, bm25Limit);
    
    // Paso 2: Vectorial
    const vectorResults = await searchWithEmbeddings(queryEmbedding, bm25Limit);
    
    // Paso 3: Combinar y re-ranking
    const combinedMap = new Map<string, ChunkWithScore>();
    
    // Agregar resultados BM25
    bm25Results.forEach((chunk, index) => {
      const normalizedScore = 1 - (index / bm25Results.length);
      combinedMap.set(chunk.chunkId, {
        ...chunk,
        bm25Score: normalizedScore,
        combinedScore: normalizedScore * bm25Weight
      });
    });
    
    // Agregar resultados vectoriales
    vectorResults.forEach((chunk, index) => {
      const normalizedScore = chunk.similarityScore || 0;
      const existing = combinedMap.get(chunk.chunkId);
      
      if (existing) {
        existing.combinedScore = (existing.combinedScore || 0) + (normalizedScore * vectorWeight);
      } else {
        combinedMap.set(chunk.chunkId, {
          ...chunk,
          combinedScore: normalizedScore * vectorWeight
        });
      }
    });
    
    // Ordenar por score combinado
    const finalResults = Array.from(combinedMap.values())
      .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
      .slice(0, finalLimit);
    
    console.log(`📊 Búsqueda híbrida completa: ${finalResults.length} resultados finales`);
    return finalResults;
  } catch (error) {
    console.error('Error en búsqueda híbrida completa:', error);
    return [];
  }
}

// Función para obtener chunks por documento
export async function getChunksByDocument(documentId: string, limit: number = 100) {
  try {
    console.log(`📄 Obteniendo chunks para documento: ${documentId}`);
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        sectionId: chunks.sectionId,
        legalDocumentName: chunks.legalDocumentName,
        legalDocumentCode: chunks.legalDocumentCode,
        articleNumber: chunks.articleNumber,
        sectionNumber: chunks.sectionNumber,
        paragraphNumber: chunks.paragraphNumber,
        createdAt: chunks.createdAt,
        startPage: chunks.startPage,
        endPage: chunks.endPage,
        vectorId: chunks.vectorId,
        hierarchyId: chunks.hierarchyId
      })
      .from(chunks)
      .innerJoin(sections, eq(chunks.sectionId, sections.sectionId))
      .where(eq(sections.documentId, documentId))
      .orderBy(asc(chunks.chunkOrder))
      .limit(limit);
    
    console.log(`📊 Encontrados ${results.length} chunks para el documento`);
    return results;
  } catch (error) {
    console.error('Error al obtener chunks por documento:', error);
    return [];
  }
}

// Función para eliminar chat history
export async function deleteChatHistory(chatId?: string, sessionId?: string) {
  try {
    console.log('🗑️ Eliminando historial de chat...');
    
    if (chatId) {
      await db
        .delete(chatHistory)
        .where(eq(chatHistory.id, chatId));
      console.log(`🗑️ Eliminado chat específico: ${chatId}`);
    } else if (sessionId) {
      await db
        .delete(chatHistory)
        .where(eq(chatHistory.sessionId, sessionId));
      console.log(`🗑️ Eliminado historial de sesión: ${sessionId}`);
    } else {
      throw new Error('Se requiere chatId o sessionId para eliminar');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar historial de chat:', error);
    throw error;
  }
}

// Función para obtener estadísticas completas de la base de datos
export async function getCompleteDatabaseStats() {
  try {
    console.log('📊 Obteniendo estadísticas completas de la base de datos...');
    
    // Contar documentos
    const documentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);
    
    // Contar chunks
    const chunksCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chunks);
    
    // Contar embeddings
    const embeddingsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(embeddings);
    
    // Contar chat history
    const chatHistoryCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatHistory);
    
    // Obtener documentos más recientes
    const recentDocuments = await db
      .select({
        documentId: documents.documentId,
        source: documents.source,
        createdAt: documents.createdAt
      })
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(5);
    
    const stats = {
      documents: documentsCount[0]?.count || 0,
      chunks: chunksCount[0]?.count || 0,
      embeddings: embeddingsCount[0]?.count || 0,
      chatHistory: chatHistoryCount[0]?.count || 0,
      recentDocuments: recentDocuments
    };
    
    console.log('📊 Estadísticas completas obtenidas:', stats);
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas completas:', error);
    return {
      documents: 0,
      chunks: 0,
      embeddings: 0,
      chatHistory: 0,
      recentDocuments: []
    };
  }
} 