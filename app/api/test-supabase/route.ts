import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    
    const supabase = await createClient();
    
    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en consulta de prueba:', error);
      return NextResponse.json({
        success: false,
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Conexión a Supabase funcionando correctamente'
    });
    
  } catch (e: any) {
    console.error('❌ Error general en prueba de Supabase:', e);
    return NextResponse.json({
      success: false,
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
} 