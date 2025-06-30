import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Función auxiliar para dividir arrays en lotes
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del documento es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    console.log(`🗑️ Iniciando eliminación del documento: ${id}`);
    
    // 1. Obtener todas las secciones del documento
    const { data: sections, error: sectionsQueryError } = await supabase
      .from('sections')
      .select('section_id')
      .eq('document_id', String(id).trim());

    if (sectionsQueryError) {
      console.error('Error al obtener secciones:', sectionsQueryError);
      return NextResponse.json(
        { error: 'Error al obtener las secciones del documento' },
        { status: 500 }
      );
    }

    console.log(`📋 Encontradas ${sections?.length || 0} secciones`);

    // 2. Si hay secciones, eliminar en orden: embeddings → chunks → sections
    if (sections && sections.length > 0) {
      const sectionIds = sections.map(s => s.section_id);
      
      // 2a. Obtener todos los chunks de las secciones
      const { data: chunks, error: chunksQueryError } = await supabase
        .from('chunks')
        .select('chunk_id, chunk_text, document_id');
      console.log('TOTAL CHUNKS TRAIDOS:', chunks?.length);

      if (chunksQueryError) {
        console.error('Error al obtener chunks:', chunksQueryError);
        return NextResponse.json(
          { error: 'Error al obtener los chunks del documento' },
          { status: 500 }
        );
      }

      console.log(`🧩 Encontrados ${chunks?.length || 0} chunks`);
      console.log('PRIMEROS CHUNKS:', (chunks || []).slice(0, 5).map(c => c.document_id));

      const docId = 'dd8b664a-cd48-4d1c-8a03-c82af5e238b4';
      const matchingChunks = (chunks || []).filter(chunk => String(chunk.document_id).trim() === docId);
      console.log('CHUNKS CON DOC_ID PROBLEMATICO:', matchingChunks.length);

      // 2b. Si hay chunks, eliminar embeddings en lotes de 50
      if (chunks && chunks.length > 0) {
        const chunkIds = chunks.map(c => c.chunk_id);
        const chunkBatches = chunkArray(chunkIds, 50);
        
        console.log(`🧠 Eliminando embeddings en ${chunkBatches.length} lotes de 50`);
        
        for (let i = 0; i < chunkBatches.length; i++) {
          const batch = chunkBatches[i];
          const { error: embeddingError } = await supabase
            .from('embeddings')
            .delete()
            .in('chunk_id', batch);

          if (embeddingError) {
            console.error(`Error al eliminar lote ${i + 1} de embeddings:`, embeddingError);
            // Continuar con los demás lotes
          } else {
            console.log(`✅ Lote ${i + 1}/${chunkBatches.length} de embeddings eliminado`);
          }
        }
      }

      // 2c. Ahora eliminar chunks en lotes de 50
      console.log(`🧩 Eliminando ${chunks?.length || 0} chunks en lotes`);
      
      if (chunks && chunks.length > 0) {
        const chunkBatches = chunkArray(chunks.map(c => c.chunk_id), 50);
        
        for (let i = 0; i < chunkBatches.length; i++) {
          const batch = chunkBatches[i];
          const { error: chunkError } = await supabase
            .from('chunks')
            .delete()
            .in('chunk_id', batch);

          if (chunkError) {
            console.error(`Error al eliminar lote ${i + 1} de chunks:`, chunkError);
            // Continuar con los demás lotes
          } else {
            console.log(`✅ Lote ${i + 1}/${chunkBatches.length} de chunks eliminado`);
          }
        }
        
        // 2d. Verificar que todos los chunks se eliminaron correctamente
        console.log('🔍 Verificando que todos los chunks fueron eliminados...');
        const { data: remainingChunks, error: verifyError } = await supabase
          .from('chunks')
          .select('chunk_id')
          .in('section_id', sectionIds);

        if (verifyError) {
          console.error('Error al verificar chunks restantes:', verifyError);
        } else if (remainingChunks && remainingChunks.length > 0) {
          console.log(`⚠️ Aún quedan ${remainingChunks.length} chunks. Intentando eliminación forzada...`);
          
          // Intentar eliminar los chunks restantes uno por uno
          for (const chunk of remainingChunks) {
            const { error: singleChunkError } = await supabase
              .from('chunks')
              .delete()
              .eq('chunk_id', chunk.chunk_id);
              
            if (singleChunkError) {
              console.error(`Error al eliminar chunk ${chunk.chunk_id}:`, singleChunkError);
            }
          }
        } else {
          console.log('✅ Todos los chunks fueron eliminados correctamente');
        }
      }
    }

    // 3. Ahora eliminar las secciones
    console.log(`📋 Eliminando ${sections?.length || 0} secciones`);
    
    const { error: sectionsError } = await supabase
      .from('sections')
      .delete()
      .eq('document_id', String(id).trim());

    if (sectionsError) {
      console.error('Error al eliminar secciones:', sectionsError);
      
      // Si hay error de clave foránea, intentar eliminar las secciones una por una
      if (sectionsError.code === '23503') {
        console.log('🔄 Intentando eliminar secciones una por una...');
        
        for (const section of sections) {
          const { error: singleSectionError } = await supabase
            .from('sections')
            .delete()
            .eq('section_id', section.section_id);
            
          if (singleSectionError) {
            console.error(`Error al eliminar sección ${section.section_id}:`, singleSectionError);
          } else {
            console.log(`✅ Sección ${section.section_id} eliminada`);
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Error al eliminar las secciones del documento' },
          { status: 500 }
        );
      }
    }

    // 4. Finalmente eliminar el documento
    console.log(`📚 Eliminando documento ${id}`);
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('document_id', String(id).trim());

    if (error) {
      console.error('Error al eliminar documento:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el documento' },
        { status: 500 }
      );
    }

    console.log(`✅ Documento ${id} eliminado exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado correctamente'
    });

  } catch (error) {
    console.error('Error en el endpoint DELETE /api/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 