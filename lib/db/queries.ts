import { db } from './index';
import { chunks, documents, embeddings, sections, chatHistory } from './schema';
import { eq, desc, asc, sql, and, or, like, ilike } from 'drizzle-orm';
import type { Chunk, Document } from './schema';

// Tipo para resultados de búsqueda con score
type ChunkWithScore = Chunk & { bm25Score?: number; combinedScore?: number };

// Función para búsqueda BM25
export async function searchWithBM25(query: string, limit: number = 30): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda BM25 para:', query);
    
    const results = await db
      .select({
        chunkId: chunks.chunkId,
        chunkText: chunks.chunkText,
        charCount: chunks.charCount,
        chunkOrder: chunks.chunkOrder,
        documentId: chunks.documentId,
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
        // Score de BM25
        bm25Score: sql<number>`ts_rank(
          to_tsvector('spanish', ${chunks.chunkText}), 
          plainto_tsquery('spanish', ${query})
        )`.as('bm25_score')
      })
      .from(chunks)
      .where(sql`to_tsvector('spanish', ${chunks.chunkText}) @@ plainto_tsquery('spanish', ${query})`)
      .orderBy(desc(sql`bm25_score`))
      .limit(limit);

    console.log(`📊 BM25 encontró ${results.length} resultados`);
    return results;
  } catch (error) {
    console.error('Error en búsqueda BM25:', error);
    return [];
  }
}

// Función para búsqueda híbrida: BM25 + Embeddings
export async function searchHybrid(
  query: string, 
  queryEmbedding: number[], 
  bm25Limit: number = 30,
  finalLimit: number = 10
): Promise<ChunkWithScore[]> {
  try {
    console.log('🔍 Ejecutando búsqueda híbrida...');
    
    // Paso 1: BM25 para obtener candidatos iniciales
    const bm25Results = await searchWithBM25(query, bm25Limit);
    
    if (bm25Results.length === 0) {
      console.log('⚠️ BM25 no encontró resultados');
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
        documentId: chunks.documentId,
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
        // Score combinado: BM25 + Similitud vectorial
        combinedScore: sql<number>`(
          COALESCE(ts_rank(
            to_tsvector('spanish', ${chunks.chunkText}), 
            plainto_tsquery('spanish', ${query})
          ), 0) * 0.3 + 
          COALESCE(1 - (${embeddings.embedding}::vector <=> ${queryEmbedding}::vector), 0) * 0.7
        )`.as('combined_score')
      })
      .from(chunks)
      .innerJoin(embeddings, eq(chunks.chunkId, embeddings.chunkId))
      .where(sql`${chunks.chunkId} = ANY(${chunkIds})`)
      .orderBy(desc(sql`combined_score`))
      .limit(finalLimit);

    console.log(`📊 Búsqueda híbrida encontró ${hybridResults.length} resultados finales`);
    return hybridResults;
  } catch (error) {
    console.error('Error en búsqueda híbrida:', error);
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

    return results;
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