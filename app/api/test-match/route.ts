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
    
    // Obtener query de los parámetros de URL
    const url = new URL(req.url);
    const testQuery = url.searchParams.get('query') || "poder ejecutivo";
    console.log('🧪 Probando con query:', testQuery);
    
    // Generar embedding
    const queryEmbedding = await getEmbeddings(testQuery);
    console.log('✅ Embedding generado, longitud:', queryEmbedding.length);
    
    // Probar la función match_documents directamente
    console.log('🔍 Ejecutando match_documents...');
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 5
    });

    if (error) {
      console.error('❌ Error en match_documents:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    console.log('✅ Resultado de match_documents:', documents);
    
    // También probar una consulta SQL directa para verificar los datos
    console.log('🔍 Probando consulta SQL directa...');
    const { data: directQuery, error: directError } = await supabase
      .from('documents')
      .select(`
        document_id,
        source,
        sections!inner(
          section_id,
          chunks!inner(
            chunk_id,
            chunk_text,
            vector_id,
            embeddings!inner(
              vector_id,
              embedding
            )
          )
        )
      `);

    if (directError) {
      console.error('❌ Error en consulta directa:', directError);
    } else {
      console.log('✅ Consulta directa exitosa, documentos encontrados:', directQuery?.length || 0);
    }

    return NextResponse.json({
      success: true,
      testQuery,
      embeddingLength: queryEmbedding.length,
      matchDocumentsResult: documents,
      directQueryResult: directQuery,
      errors: {
        matchDocuments: error,
        directQuery: directError
      }
    });
    
  } catch (error) {
    console.error('Error en endpoint de prueba:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 