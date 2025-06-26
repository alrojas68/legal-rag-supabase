import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔧 Arreglando función RPC match_documents...');
    
    // SQL para arreglar la función RPC
    const fixSQL = `
      -- Eliminar todas las funciones match_documents existentes
      DROP FUNCTION IF EXISTS match_documents(text, integer);
      DROP FUNCTION IF EXISTS match_documents(VECTOR(768), integer);
      DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), integer);

      -- Crear función simple que funcione con embeddings almacenados como JSON strings
      CREATE OR REPLACE FUNCTION match_documents(
          query_embedding VECTOR(768),
          match_count INT DEFAULT 10
      )
      RETURNS TABLE (
          document_id UUID,
          source TEXT,
          content TEXT,
          similarity_score FLOAT
      )
      LANGUAGE plpgsql
      AS $$
      DECLARE
          db_embedding VECTOR(768);
      BEGIN
          RETURN QUERY
          SELECT 
              d.document_id,
              d.source,
              c.chunk_text as content,
              1 - (db_embedding <=> query_embedding) as similarity_score
          FROM documents d
          JOIN sections s ON d.document_id = s.document_id
          JOIN chunks c ON s.section_id = c.section_id
          JOIN embeddings e ON c.vector_id = e.vector_id
          CROSS JOIN LATERAL (
              SELECT CASE 
                  WHEN e.embedding IS NULL THEN NULL
                  WHEN jsonb_typeof(e.embedding::jsonb) = 'array' THEN e.embedding::jsonb::text::vector(768)
                  ELSE e.embedding::text::vector(768)
              END as db_embedding
          ) emb
          WHERE emb.db_embedding IS NOT NULL
          ORDER BY emb.db_embedding <=> query_embedding
          LIMIT match_count;
      END;
      $$;
    `;
    
    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Error al ejecutar SQL:', error);
      
      // Intentar ejecutar directamente con query
      const { error: directError } = await supabase
        .from('documents')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('❌ Error en consulta directa:', directError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'No se pudo ejecutar el SQL directamente. Necesitas ejecutar manualmente en Supabase SQL Editor.',
        manualSQL: fixSQL
      });
    }
    
    console.log('✅ Función RPC arreglada');
    
    // Probar la función
    const testQuery = "condominio";
    const { data: testResult, error: testError } = await supabase.rpc('match_documents', {
      query_embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, ...Array(758).fill(0)], // Embedding de prueba
      match_count: 5
    });
    
    if (testError) {
      console.error('❌ Error al probar función:', testError);
      return NextResponse.json({
        success: false,
        error: 'Función creada pero hay error al probarla',
        testError: testError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Función RPC arreglada correctamente',
      testResult: testResult?.length || 0
    });
    
  } catch (error) {
    console.error('Error al arreglar RPC:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 