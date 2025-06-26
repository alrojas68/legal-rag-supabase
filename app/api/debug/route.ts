import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar Gemini
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY no está configurada en las variables de entorno');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Función para obtener embeddings usando Gemini
async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length !== 768) {
      throw new Error('El embedding generado no tiene la dimensión correcta');
    }
    
    return embedding;
  } catch (error) {
    console.error('Error al obtener embeddings de Gemini:', error);
    throw error;
  }
}

// Función para calcular similitud coseno
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (norm1 * norm2);
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({
        error: 'Se requiere una consulta (query)',
        success: false
      }, { status: 400 });
    }

    console.log('🔍 DEBUG: Analizando consulta:', query);
    
    // Crear cliente de Supabase
    const supabase = await createClient();

    // Obtener embedding de la consulta
    const queryEmbedding = await getEmbeddings(query);
    console.log('✅ Embedding de consulta generado');

    // Buscar chunks con similitud alta
    const { data: results, error } = await supabase
      .from('embeddings')
      .select(`
        embedding,
        chunks!inner(
          chunk_id,
          chunk_text,
          vector_id,
          sections!inner(
            section_id,
            documents!inner(
              document_id,
              source,
              publication_date,
              last_reform_date,
              jurisdiction,
              doc_type
            )
          )
        )
      `)
      .limit(100);

    if (error) {
      console.error('Error en búsqueda:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcular similitud y analizar contenido
    const analyzedChunks = [];
    for (const result of results || []) {
      const embedding = result.embedding;
      const chunk = result.chunks;
      
      if (chunk && embedding) {
        let dbEmbedding: number[];
        
        if (typeof embedding === 'string') {
          try {
            dbEmbedding = JSON.parse(embedding);
          } catch (parseError) {
            continue;
          }
        } else if (Array.isArray(embedding)) {
          dbEmbedding = embedding;
        } else {
          continue;
        }
        
        if (dbEmbedding.length !== 768) {
          continue;
        }
        
        const similarity = calculateCosineSimilarity(queryEmbedding, dbEmbedding);
        
        // Analizar contenido del chunk
        const chunkText = (chunk as any).chunk_text.toLowerCase();
        const queryTerms = query.toLowerCase().split(' ');
        
        const termMatches = queryTerms.filter((term: string) => 
          chunkText.includes(term) && term.length > 2
        );
        
        const relatedTerms = [];
        if (chunkText.includes('registro') || chunkText.includes('civil')) {
          relatedTerms.push('registro civil');
        }
        if (chunkText.includes('acta') || chunkText.includes('actos')) {
          relatedTerms.push('actas/actos');
        }
        if (chunkText.includes('nacimiento') || chunkText.includes('matrimonio') || chunkText.includes('defunción')) {
          relatedTerms.push('documentos civiles');
        }
        if (chunkText.includes('oficial') || chunkText.includes('público')) {
          relatedTerms.push('documentos oficiales');
        }
        
        analyzedChunks.push({
          chunk_id: (chunk as any).chunk_id,
          source: (chunk as any).sections.documents.source,
          similarity_score: similarity,
          chunk_text: (chunk as any).chunk_text.substring(0, 200) + '...',
          term_matches: termMatches,
          related_terms: relatedTerms,
          full_text: (chunk as any).chunk_text
        });
      }
    }

    // Ordenar por similitud
    analyzedChunks.sort((a, b) => b.similarity_score - a.similarity_score);

    // Tomar los mejores 10
    const topChunks = analyzedChunks.slice(0, 10);

    console.log('📊 DEBUG: Top chunks encontrados:', topChunks.length);
    console.log('📄 Mejores scores:', topChunks.slice(0, 3).map(c => c.similarity_score.toFixed(4)));

    return NextResponse.json({
      success: true,
      query: query,
      total_chunks_analyzed: analyzedChunks.length,
      top_chunks: topChunks,
      analysis: {
        chunks_with_high_similarity: analyzedChunks.filter(c => c.similarity_score > 0.5).length,
        chunks_with_medium_similarity: analyzedChunks.filter(c => c.similarity_score > 0.3 && c.similarity_score <= 0.5).length,
        chunks_with_low_similarity: analyzedChunks.filter(c => c.similarity_score <= 0.3).length,
        chunks_with_term_matches: analyzedChunks.filter(c => c.term_matches.length > 0).length,
        chunks_with_related_terms: analyzedChunks.filter(c => c.related_terms.length > 0).length
      }
    });

  } catch (error) {
    console.error('Error en debug endpoint:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    }, { status: 500 });
  }
} 