import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 Verificando dimensiones de embeddings...');
    
    // Obtener un embedding de ejemplo
    const { data: sampleEmbedding, error: embError } = await supabase
      .from('embeddings')
      .select('embedding')
      .limit(1);
    
    if (embError) {
      console.error('❌ Error al obtener embedding:', embError);
      return NextResponse.json({
        success: false,
        error: embError.message
      });
    }
    
    if (!sampleEmbedding || sampleEmbedding.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron embeddings en la base de datos'
      });
    }
    
    const embedding = sampleEmbedding[0].embedding;
    const dimension = Array.isArray(embedding) ? embedding.length : 'No es array';
    
    console.log('📊 Dimensión del embedding:', dimension);
    console.log('📊 Tipo de embedding:', typeof embedding);
    
    // Verificar si es string JSON
    if (typeof embedding === 'string') {
      try {
        const parsed = JSON.parse(embedding);
        console.log('📊 Dimensión después de parsear JSON:', parsed.length);
        return NextResponse.json({
          success: true,
          originalType: 'string',
          parsedDimension: parsed.length,
          originalDimension: dimension
        });
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Embedding es string pero no es JSON válido',
          originalType: 'string',
          originalDimension: dimension
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      dimension: dimension,
      type: typeof embedding
    });
    
  } catch (error) {
    console.error('Error al verificar embeddings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 