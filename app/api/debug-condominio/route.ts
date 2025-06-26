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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 DIAGNÓSTICO COMPLETO DE CONDOMINIO');
    
    // 1. Verificar documentos disponibles
    console.log('📚 1. Verificando documentos...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('document_id, source')
      .limit(50);
    
    if (docsError) {
      console.error('❌ Error al obtener documentos:', docsError);
    } else {
      console.log(`✅ Documentos encontrados: ${documents?.length || 0}`);
      console.log('📄 Fuentes disponibles:', documents?.map((d: any) => d.source) || []);
    }
    
    // 2. Buscar específicamente por "condominio"
    console.log('🔍 2. Buscando chunks con "condominio"...');
    const { data: condominioChunks, error: condError } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, documents!inner(source)')
      .ilike('chunk_text', '%condominio%')
      .limit(10);
    
    if (condError) {
      console.error('❌ Error al buscar condominio:', condError);
    } else {
      console.log(`✅ Chunks con "condominio": ${condominioChunks?.length || 0}`);
      if (condominioChunks && condominioChunks.length > 0) {
        console.log('📄 Ejemplos:');
        condominioChunks.forEach((chunk: any, idx: number) => {
          console.log(`  ${idx + 1}. ${chunk.documents.source}`);
          console.log(`     Texto: ${chunk.chunk_text.substring(0, 300)}...`);
          console.log('     ---');
        });
      }
    }
    
    // 3. Buscar por "régimen" (término relacionado)
    console.log('🔍 3. Buscando chunks con "régimen"...');
    const { data: regimenChunks, error: regimenError } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, documents!inner(source)')
      .ilike('chunk_text', '%régimen%')
      .limit(5);
    
    if (regimenError) {
      console.error('❌ Error al buscar régimen:', regimenError);
    } else {
      console.log(`✅ Chunks con "régimen": ${regimenChunks?.length || 0}`);
    }
    
    // 4. Verificar embeddings
    console.log('🔍 4. Verificando embeddings...');
    const { data: embeddings, error: embError } = await supabase
      .from('embeddings')
      .select('vector_id, chunk_id', { count: 'exact' });
    
    if (embError) {
      console.error('❌ Error al contar embeddings:', embError);
    } else {
      console.log(`✅ Total de embeddings: ${embeddings?.length || 0}`);
    }
    
    // 5. Probar búsqueda vectorial
    console.log('🔍 5. Probando búsqueda vectorial...');
    const query = "cuales son los requisitos para un condominio?";
    const queryEmbedding = await getEmbeddings(query);
    console.log('✅ Embedding generado, longitud:', queryEmbedding.length);
    
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 10
    });
    
    if (vectorError) {
      console.error('❌ Error en búsqueda vectorial:', vectorError);
    } else {
      console.log(`✅ Resultados vectoriales: ${vectorResults?.length || 0}`);
      if (vectorResults && vectorResults.length > 0) {
        console.log('📄 Top 3 resultados:');
        vectorResults.slice(0, 3).forEach((doc: any, idx: number) => {
          console.log(`  ${idx + 1}. ${doc.source} (score: ${doc.similarity_score?.toFixed(4)})`);
          if (doc.content) {
            console.log(`     Contenido: ${doc.content.substring(0, 200)}...`);
          }
        });
      }
    }
    
    // 6. Verificar estructura de la función RPC
    console.log('🔍 6. Verificando función RPC...');
    const { data: rpcInfo, error: rpcError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: 1
      });
    
    if (rpcError) {
      console.error('❌ Error en RPC:', rpcError);
    } else {
      console.log('✅ RPC funciona, estructura del resultado:', Object.keys(rpcInfo?.[0] || {}));
    }
    
    return NextResponse.json({
      success: true,
      diagnosis: {
        totalDocuments: documents?.length || 0,
        documents: documents?.map((d: any) => d.source) || [],
        condominioChunks: condominioChunks?.length || 0,
        regimenChunks: regimenChunks?.length || 0,
        totalEmbeddings: embeddings?.length || 0,
        vectorResults: vectorResults?.length || 0,
        topVectorResults: vectorResults?.slice(0, 3).map((doc: any) => ({
          source: doc.source,
          score: doc.similarity_score,
          content: doc.content?.substring(0, 200)
        })) || []
      }
    });
    
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 