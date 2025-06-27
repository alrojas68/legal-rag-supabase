import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔧 Aplicando corrección de función match_documents...');
    
    // Leer el script SQL
    const scriptPath = path.join(process.cwd(), 'scripts', 'fix-match-documents-final.sql');
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    // Ejecutar el script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Error al aplicar corrección:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    console.log('✅ Función match_documents corregida exitosamente');
    
    // Probar la función corregida
    const testEmbedding = new Array(768).fill(0.1); // Embedding de prueba
    
    const { data: testResult, error: testError } = await supabase.rpc('match_documents', {
      query_embedding: testEmbedding,
      match_count: 1
    });
    
    if (testError) {
      console.error('❌ Error al probar función:', testError);
      return NextResponse.json({
        success: false,
        error: 'Función aplicada pero falló la prueba: ' + testError.message
      }, { status: 500 });
    }
    
    console.log('✅ Función probada exitosamente');
    
    return NextResponse.json({
      success: true,
      message: 'Función match_documents corregida y probada exitosamente',
      test_result: testResult?.length || 0
    });
    
  } catch (error) {
    console.error('Error al aplicar corrección:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 