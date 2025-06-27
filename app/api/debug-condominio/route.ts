import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Función para obtener embeddings
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

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DIAGNÓSTICO: Verificando estructura de tablas...');
    
    // Verificar estructura de la tabla chunks
    const { data: chunksStructure, error: chunksError } = await supabase
      .from('chunks')
      .select('*')
      .limit(1);
    
    if (chunksError) {
      console.error('❌ Error al verificar chunks:', chunksError);
    } else {
      console.log('✅ Estructura de chunks:', Object.keys(chunksStructure?.[0] || {}));
    }
    
    // Verificar estructura de embeddings
    const { data: embeddingsStructure, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('*')
      .limit(1);
    
    if (embeddingsError) {
      console.error('❌ Error al verificar embeddings:', embeddingsError);
    } else {
      console.log('✅ Estructura de embeddings:', Object.keys(embeddingsStructure?.[0] || {}));
    }
    
    // Verificar documentos disponibles
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*');
    
    if (docsError) {
      console.error('❌ Error al verificar documentos:', docsError);
    } else {
      console.log('📚 Documentos disponibles:', documents?.map(d => d.source));
    }
    
    // Verificar chunks con embeddings
    const { data: chunksWithEmbeddings, error: chunksEmbedError } = await supabase
      .from('chunks')
      .select(`
        chunk_id,
        chunk_text,
        vector_id,
        embeddings!inner(vector_id)
      `)
      .limit(5);
    
    if (chunksEmbedError) {
      console.error('❌ Error al verificar chunks con embeddings:', chunksEmbedError);
    } else {
      console.log('📊 Chunks con embeddings:', chunksWithEmbeddings?.length || 0);
    }
    
    // Probar búsqueda BM25 simple
    const { data: bm25Test, error: bm25Error } = await supabase
      .from('chunks')
      .select('chunk_text')
      .textSearch('chunk_text', 'derechos', {
        type: 'plain',
        config: 'spanish'
      })
      .limit(5);
    
    if (bm25Error) {
      console.error('❌ Error en búsqueda BM25:', bm25Error);
    } else {
      console.log('✅ Búsqueda BM25 exitosa:', bm25Test?.length || 0, 'resultados');
    }
    
    return NextResponse.json({
      success: true,
      chunks_structure: chunksStructure?.[0] ? Object.keys(chunksStructure[0]) : null,
      embeddings_structure: embeddingsStructure?.[0] ? Object.keys(embeddingsStructure[0]) : null,
      documents_count: documents?.length || 0,
      chunks_with_embeddings: chunksWithEmbeddings?.length || 0,
      bm25_test_success: !bm25Error,
      errors: {
        chunks: chunksError?.message,
        embeddings: embeddingsError?.message,
        documents: docsError?.message,
        chunks_embeddings: chunksEmbedError?.message,
        bm25: bm25Error?.message
      }
    });
    
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 