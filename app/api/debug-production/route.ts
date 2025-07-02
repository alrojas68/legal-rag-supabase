import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug de producción iniciado...');
    
    const results: any = {};
    
    // 1. Verificar conexión básica
    console.log('1️⃣ Probando conexión básica...');
    try {
      const connectionTest = await db.execute('SELECT 1 as test');
      results.connection = {
        success: true,
        data: connectionTest
      };
    } catch (error) {
      results.connection = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    // 2. Verificar tablas existentes
    console.log('2️⃣ Verificando tablas...');
    try {
      const tables = await db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      results.tables = {
        success: true,
        data: tables.map((t: any) => t.table_name)
      };
    } catch (error) {
      results.tables = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    // 3. Verificar documentos
    console.log('3️⃣ Verificando documentos...');
    try {
      const documents = await db.execute('SELECT COUNT(*) as count FROM documents');
      results.documents = {
        success: true,
        count: Number(documents[0]?.count) || 0
      };
    } catch (error) {
      results.documents = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    // 4. Verificar chunks
    console.log('4️⃣ Verificando chunks...');
    try {
      const chunks = await db.execute('SELECT COUNT(*) as count FROM chunks');
      results.chunks = {
        success: true,
        count: Number(chunks[0]?.count) || 0
      };
    } catch (error) {
      results.chunks = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    // 5. Verificar embeddings
    console.log('5️⃣ Verificando embeddings...');
    try {
      const embeddings = await db.execute('SELECT COUNT(*) as count FROM embeddings');
      results.embeddings = {
        success: true,
        count: Number(embeddings[0]?.count) || 0
      };
    } catch (error) {
      results.embeddings = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    // 6. Probar búsqueda BM25 simple
    console.log('6️⃣ Probando búsqueda BM25...');
    try {
      const bm25Test = await db.execute(`
        SELECT chunk_text, ts_rank_cd(
          to_tsvector('spanish', chunk_text), 
          plainto_tsquery('spanish', 'herencia')
        ) as score 
        FROM chunks 
        WHERE to_tsvector('spanish', chunk_text) @@ plainto_tsquery('spanish', 'herencia')
        ORDER BY score DESC 
        LIMIT 3
      `);
      results.bm25_test = {
        success: true,
        results: bm25Test.length,
        sample: bm25Test[0]?.chunk_text?.substring(0, 100) + '...' || 'No hay resultados'
      };
    } catch (error) {
      results.bm25_test = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
    
    console.log('✅ Debug completado');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      results
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error general en debug',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 