import { NextRequest, NextResponse } from 'next/server';
import { getAllDocumentsWithStats } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    console.log('📚 Endpoint /api/documents: Obteniendo documentos con Drizzle...');
    
    const documents = await getAllDocumentsWithStats();

    return NextResponse.json({
      success: true,
      documents: documents,
      total: documents.length
    });

  } catch (error) {
    console.error('Error en el endpoint /api/documents:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 