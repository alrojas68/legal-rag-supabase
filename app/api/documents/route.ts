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

    // Obtener todas las secciones y chunks de una vez para eficiencia
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('section_id, document_id');
    if (sectionsError) {
      console.error('Error al obtener secciones:', sectionsError);
      return NextResponse.json(
        { error: `Error al obtener las secciones: ${sectionsError.message}` },
        { status: 500 }
      );
    }

    const { data: chunks, error: chunksError } = await supabase
      .from('chunks')
      .select('chunk_id, chunk_text, section_id')
      .limit(10000);
    if (chunksError) {
      console.error('Error al obtener chunks:', chunksError);
      return NextResponse.json(
        { error: `Error al obtener los chunks: ${chunksError.message}` },
        { status: 500 }
      );
    }

    // Mapear secciones por documento
    const seccionesPorDocumento: Record<string, string[]> = {};
    for (const section of sections || []) {
      if (!seccionesPorDocumento[section.document_id]) {
        seccionesPorDocumento[section.document_id] = [];
      }
      seccionesPorDocumento[section.document_id].push(section.section_id);
    }

    // Mapear chunks por documento
    const processedDocuments = (documents || []).map((doc) => {
      const secciones = seccionesPorDocumento[doc.document_id] || [];
      const chunksDelDocumento = (chunks || []).filter(chunk => secciones.includes(chunk.section_id));
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