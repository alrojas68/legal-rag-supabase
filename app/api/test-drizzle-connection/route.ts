import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`🧪 Probando conexión de Drizzle (${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'})...`);
    
    if (!isProduction) {
      return NextResponse.json({
        success: false,
        message: 'Drizzle solo disponible en producción',
        environment: 'development',
        timestamp: new Date().toISOString()
      });
    }
    
    // Probar una consulta simple para ver qué tablas existen
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('✅ Tablas encontradas:', tables);
    
    // Si hay tablas, probar contar documentos
    let documentCount = 0;
    if (tables.some((t: any) => t.table_name === 'documents')) {
      const countResult = await db.execute('SELECT COUNT(*) as count FROM documents');
      documentCount = Number(countResult[0]?.count) || 0;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conexión de Drizzle exitosa en producción',
      environment: 'production',
      tables: tables.map((t: any) => t.table_name),
      documentCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en conexión de Drizzle:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en conexión de Drizzle',
      details: error instanceof Error ? error.message : 'Error desconocido',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 