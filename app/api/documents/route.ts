import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Obtener documentos
    const { data: documents, error } = await supabase
      .from('documents')
      .select('document_id, source, created_at');

    if (error) {
      console.error('Error al obtener documentos:', error);
      return NextResponse.json(
        { error: `Error al obtener los documentos: ${error.message}` },
        { status: 500 }
      );
    }

    // Obtener todos los chunks usando paginación para evitar límites
    let allChunks: any[] = [];
    let from = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: chunksPage, error: chunksError } = await supabase
        .from('chunks')
        .select('chunk_id, chunk_text, document_id')
        .range(from, from + pageSize - 1);
      
      if (chunksError) {
        console.error('Error al obtener chunks:', chunksError);
        return NextResponse.json(
          { error: `Error al obtener los chunks: ${chunksError.message}` },
          { status: 500 }
        );
      }
      
      if (!chunksPage || chunksPage.length === 0) {
        break; // No hay más chunks
      }
      
      allChunks = allChunks.concat(chunksPage);
      from += pageSize;
      
      // Si trajo menos de pageSize, significa que ya no hay más
      if (chunksPage.length < pageSize) {
        break;
      }
    }
    
    const chunks = allChunks;

    // Mapear chunks por documento
    const processedDocuments = (documents || []).map((doc) => {
      const chunksDelDocumento = (chunks || []).filter(chunk =>
        String(chunk.document_id).trim() === String(doc.document_id).trim()
      );
      const totalCharacters = chunksDelDocumento.reduce((total, chunk) => total + (chunk.chunk_text?.length || 0), 0);
      return {
        id: doc.document_id,
        name: doc.source,
        createdAt: doc.created_at,
        chunks: chunksDelDocumento.length,
        totalCharacters: totalCharacters
      };
    });

    return NextResponse.json({
      success: true,
      documents: processedDocuments,
      total: processedDocuments.length
    });

  } catch (error) {
    console.error('Error en el endpoint /api/documents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 