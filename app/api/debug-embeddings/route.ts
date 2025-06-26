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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Verificar embeddings en la base de datos
    console.log('🔍 Verificando embeddings en la base de datos...');
    const { data: embeddings, error: embError } = await supabase
      .from('embeddings')
      .select('*')
      .limit(5);

    if (embError) {
      console.error('Error al obtener embeddings:', embError);
      return NextResponse.json({
        success: false,
        error: 'Error al obtener embeddings de la base de datos'
      });
    }

    // 2. Verificar chunks
    console.log('📄 Verificando chunks...');
    const { data: chunks, error: chunksError } = await supabase
      .from('chunks')
      .select('*')
      .limit(5);

    if (chunksError) {
      console.error('Error al obtener chunks:', chunksError);
    }

    // 3. Generar un embedding de prueba
    console.log('🧠 Generando embedding de prueba...');
    const testText = "artículo 19 constitución";
    const testEmbedding = await getEmbeddings(testText);
    
    // 4. Verificar formato de embeddings en la base
    let embeddingAnalysis = {
      totalEmbeddings: 0,
      validEmbeddings: 0,
      invalidEmbeddings: 0,
      sampleEmbedding: null,
      embeddingLength: 0
    };

    if (embeddings && embeddings.length > 0) {
      embeddingAnalysis.totalEmbeddings = embeddings.length;
      const sampleEmbedding = embeddings[0];
      
      if (sampleEmbedding.embedding) {
        // Verificar si es un array o string
        if (Array.isArray(sampleEmbedding.embedding)) {
          embeddingAnalysis.embeddingLength = sampleEmbedding.embedding.length;
          embeddingAnalysis.validEmbeddings = embeddings.filter(e => Array.isArray(e.embedding) && e.embedding.length === 768).length;
          embeddingAnalysis.invalidEmbeddings = embeddings.length - embeddingAnalysis.validEmbeddings;
          embeddingAnalysis.sampleEmbedding = sampleEmbedding.embedding.slice(0, 5); // Primeros 5 valores
        } else if (typeof sampleEmbedding.embedding === 'string') {
          try {
            const parsed = JSON.parse(sampleEmbedding.embedding);
            embeddingAnalysis.embeddingLength = parsed.length;
            embeddingAnalysis.validEmbeddings = embeddings.filter(e => {
              try {
                const parsed = JSON.parse(e.embedding);
                return Array.isArray(parsed) && parsed.length === 768;
              } catch {
                return false;
              }
            }).length;
            embeddingAnalysis.invalidEmbeddings = embeddings.length - embeddingAnalysis.validEmbeddings;
            embeddingAnalysis.sampleEmbedding = parsed.slice(0, 5);
          } catch (parseError) {
            embeddingAnalysis.invalidEmbeddings = embeddings.length;
          }
        }
      }
    }

    // 5. Probar similitud con embeddings de la base
    let similarityTest = {
      testQuery: testText,
      testEmbeddingLength: testEmbedding.length,
      similarities: [] as Array<{
        embeddingId: string;
        similarity: number;
        format: string;
      }>
    };

    if (embeddings && embeddings.length > 0) {
      for (let i = 0; i < Math.min(3, embeddings.length); i++) {
        const dbEmbedding = embeddings[i].embedding;
        let similarity = 0;
        
        if (Array.isArray(dbEmbedding)) {
          similarity = calculateCosineSimilarity(testEmbedding, dbEmbedding);
        } else if (typeof dbEmbedding === 'string') {
          try {
            const parsed = JSON.parse(dbEmbedding);
            similarity = calculateCosineSimilarity(testEmbedding, parsed);
          } catch {
            similarity = 0;
          }
        }
        
        similarityTest.similarities.push({
          embeddingId: embeddings[i].vector_id,
          similarity: similarity,
          format: Array.isArray(dbEmbedding) ? 'array' : 'string'
        });
      }
    }

    return NextResponse.json({
      success: true,
      embeddingAnalysis,
      similarityTest,
      sampleChunks: chunks?.slice(0, 2).map(c => ({
        chunk_id: c.chunk_id,
        chunk_text: c.chunk_text?.substring(0, 100) + '...',
        vector_id: c.vector_id
      })),
      errors: {
        embeddings: embError,
        chunks: chunksError
      }
    });
    
  } catch (error) {
    console.error('Error en endpoint de debug de embeddings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
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