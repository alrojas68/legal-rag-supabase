import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

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

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DIAGNÓSTICO: Verificando embeddings...');
    
    // Contar embeddings totales
    const { count: embeddingsCount, error: countError } = await supabase
      .from('embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error al contar embeddings:', countError);
    } else {
      console.log('📊 Total de embeddings:', embeddingsCount);
    }
    
    // Verificar embeddings con chunks
    const { data: embeddingsWithChunks, error: chunksError } = await supabase
      .from('embeddings')
      .select(`
        vector_id,
        chunk_id,
        embedding,
        chunks!inner(chunk_id, chunk_text)
      `)
      .limit(5);
    
    if (chunksError) {
      console.error('❌ Error al verificar embeddings con chunks:', chunksError);
    } else {
      console.log('📄 Embeddings con chunks:', embeddingsWithChunks?.length || 0);
    }
    
    // Verificar chunks sin embeddings
    const { data: chunksWithoutEmbeddings, error: noEmbError } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text')
      .not('chunk_id', 'in', `(select chunk_id from embeddings)`)
      .limit(5);
    
    if (noEmbError) {
      console.error('❌ Error al verificar chunks sin embeddings:', noEmbError);
    } else {
      console.log('📄 Chunks sin embeddings:', chunksWithoutEmbeddings?.length || 0);
    }
    
    // Probar la función match_documents
    const testEmbedding = new Array(768).fill(0.1);
    const { data: matchResult, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: testEmbedding,
      match_count: 5
    });
    
    if (matchError) {
      console.error('❌ Error en match_documents:', matchError);
    } else {
      console.log('✅ match_documents funcionó:', matchResult?.length || 0, 'resultados');
    }
    
    return NextResponse.json({
      success: true,
      total_embeddings: embeddingsCount || 0,
      embeddings_with_chunks: embeddingsWithChunks?.length || 0,
      chunks_without_embeddings: chunksWithoutEmbeddings?.length || 0,
      match_documents_working: !matchError,
      errors: {
        count: countError?.message,
        chunks: chunksError?.message,
        no_embeddings: noEmbError?.message,
        match: matchError?.message
      },
      sample_embeddings: embeddingsWithChunks?.slice(0, 2).map(e => ({
        vector_id: e.vector_id,
        chunk_id: e.chunk_id,
        has_embedding: !!e.embedding,
        chunk_text_preview: (e.chunks as any)?.chunk_text?.substring(0, 100) + '...'
      })) || []
    });
    
  } catch (error) {
    console.error('Error en diagnóstico de embeddings:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
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