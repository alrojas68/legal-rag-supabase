import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import { createClient } from '@/lib/supabase/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseFile(file: File): Promise<string> {
  console.log('Tipo de archivo recibido:', file.type);
  console.log('Nombre del archivo:', file.name);
  
  const buffer = await file.arrayBuffer();
  
  // Verificar si es un archivo DOCX por extensión o mimetype
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 (file.type === 'application/octet-stream' && file.name.toLowerCase().endsWith('.docx'));
  
  // Verificar si es un archivo PDF por extensión o mimetype
  const isPdf = file.type === 'application/pdf' ||
                (file.type === 'application/octet-stream' && file.name.toLowerCase().endsWith('.pdf'));
  
  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      if (!result.value) {
        throw new Error('No se pudo extraer texto del archivo DOCX');
      }
      return result.value;
    } catch (error) {
      console.error('Error al procesar archivo DOCX:', error);
      throw new Error('Error al procesar el archivo DOCX. Asegúrate de que el archivo no esté corrupto.');
    }
  }
  
  if (isPdf) {
    try {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extraer texto de las páginas del PDF
            let text = '';
            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              for (const page of pdfData.Pages) {
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const textItem of page.Texts) {
                    if (textItem.R && Array.isArray(textItem.R)) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + ' ';
                        }
                      }
                    }
                  }
                }
              }
            }
            
            if (!text || text.trim().length === 0) {
              reject(new Error('No se pudo extraer texto del archivo PDF'));
            } else {
              resolve(text.trim());
            }
          } catch (error) {
            reject(new Error('Error al procesar el contenido del PDF'));
          }
        });
        
        pdfParser.on('pdfParser_dataError', (errData) => {
          reject(new Error('Error al parsear el archivo PDF'));
        });
        
        pdfParser.parseBuffer(Buffer.from(buffer));
      });
    } catch (error) {
      console.error('Error al procesar archivo PDF:', error);
      throw new Error('Error al procesar el archivo PDF. Asegúrate de que el archivo no esté corrupto.');
    }
  }
  
  // Si es un archivo de texto
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    try {
      const text = new TextDecoder().decode(buffer);
      if (!text || text.trim().length === 0) {
        throw new Error('El archivo de texto está vacío');
      }
      return text;
    } catch (error) {
      console.error('Error al procesar archivo de texto:', error);
      throw new Error('Error al procesar el archivo de texto');
    }
  }
  
  throw new Error('Tipo de archivo no soportado. Solo se aceptan PDF, DOCX y archivos de texto.');
}

// Función simple de chunking
async function simpleChunking(text: string): Promise<string[]> {
  // Dividir por párrafos
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (trimmedParagraph.length === 0) continue;
    
    // Si agregar este párrafo excedería 1000 caracteres, guardar el chunk actual
    if (currentChunk.length + trimmedParagraph.length > 1000 && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedParagraph;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + trimmedParagraph;
    }
  }
  
  // Agregar el último chunk si tiene contenido
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      );
    }

    // Verificar tamaño del archivo (100MB máximo para uso local)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 100MB' },
        { status: 400 }
      );
    }
    
    console.log('📄 Procesando archivo:', file.name);
    const text = await parseFile(file);
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto del archivo' },
        { status: 400 }
      );
    }

    // Clasificación simplificada basada en el nombre del archivo
    let documentType = 'Ley Federal';
    let jurisdiction = 'Federal';
    let hierarchyLevel = 3;
    
    if (file.name.toLowerCase().includes('constitucion') || file.name.toLowerCase().includes('constitución')) {
      documentType = 'Constitución';
      hierarchyLevel = 1;
    } else if (file.name.toLowerCase().includes('codigo') || file.name.toLowerCase().includes('código')) {
      documentType = 'Ley Federal';
      hierarchyLevel = 3;
    } else if (file.name.toLowerCase().includes('ley')) {
      documentType = 'Ley Federal';
      hierarchyLevel = 3;
    }

    console.log('✂️ Generando chunks...');
    const chunks = await simpleChunking(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No se generaron chunks del texto' },
        { status: 400 }
      );
    }

    console.log(`📊 Generados ${chunks.length} chunks`);

    // Insertar documento
    const supabase = await createClient();
    const document_id = uuidv4();
    
    console.log('📝 Insertando documento...');
    
    const { error: docError } = await supabase
      .from('documents')
      .insert([{
        document_id,
        source: source || file.name,
        created_at: new Date().toISOString()
      }]);
    
    if (docError) {
      console.error('Error al insertar documento:', docError);
      return NextResponse.json(
        { error: 'Error al guardar el documento en la base de datos' },
        { status: 500 }
      );
    }
    
    console.log('✅ Documento insertado exitosamente');

    // Crear sección principal
    const section_id = uuidv4();
    const { error: sectionError } = await supabase
      .from('sections')
      .insert([{
        section_id,
        document_id,
        section_type: 'main',
        section_number: '1',
        created_at: new Date().toISOString()
      }]);
    if (sectionError) {
      console.error('Error al crear sección:', sectionError);
      return NextResponse.json(
        { error: 'Error al crear la sección principal del documento' },
        { status: 500 }
      );
    }

    // Insertar jerarquía legal simplificada
    console.log('🏛️ Insertando jerarquía legal...');
    const hierarchy_id = uuidv4();
    const { error: hierarchyError } = await supabase
      .from('legal_hierarchy')
      .insert([{
        hierarchy_id,
        document_id,
        hierarchy_level: hierarchyLevel,
        hierarchy_name: source || file.name,
        legal_document_name: source || file.name,
        legal_document_short_name: file.name.split('.')[0],
        legal_document_code: file.name.split('.')[0].toUpperCase(),
        document_type: documentType,
        user_selected_type: documentType,
        ia_suggested_type: documentType,
        jurisdiction: jurisdiction,
        is_active: true
      }]);
    
    if (hierarchyError) {
      console.error('Error al insertar jerarquía legal:', hierarchyError);
      return NextResponse.json(
        { error: 'Error al clasificar el documento legalmente' },
        { status: 500 }
      );
    }

    // Preparar datos para inserción (sin embeddings)
    const chunksData = chunks.map((chunkText, index) => ({
      chunk_id: uuidv4(),
      document_id,
      chunk_text: chunkText,
      chunk_order: index,
      article_number: null, // Si tienes lógica para extraer el artículo, ponla aquí
      char_count: chunkText.length,
      created_at: new Date().toISOString()
    }));

    // Insertar chunks en lotes
    console.log('💾 Insertando chunks...');
    const chunkBatches = chunkArray(chunksData, 50);
    
    for (let i = 0; i < chunkBatches.length; i++) {
      const batch = chunkBatches[i];
      
      // Insertar chunks
      const { error: chunkError } = await supabase
        .from('chunks')
        .insert(batch);
        
      if (chunkError) {
        console.error(`Error al insertar lote ${i + 1} de chunks:`, chunkError);
        return NextResponse.json(
          { error: 'Error al procesar el contenido del documento' },
          { status: 500 }
        );
      }
      
      console.log(`✅ Lote ${i + 1}/${chunkBatches.length} procesado`);
    }

    console.log('🎉 Documento procesado exitosamente (sin embeddings)');
    
    return NextResponse.json({
      success: true,
      message: 'Documento procesado y guardado exitosamente (sin embeddings)',
      document_id,
      chunks_count: chunks.length,
      note: 'Los embeddings se pueden generar posteriormente usando el endpoint de embeddings'
    });

  } catch (error) {
    console.error('Error en upload-no-embeddings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 