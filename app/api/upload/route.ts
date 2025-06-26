import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { spawn } from 'child_process';

// Verificar la API key al inicio
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY no está configurada en las variables de entorno');
}

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

// Interfaz para la clasificación legal
interface LegalClassification {
  hierarchy_level: number;
  legal_document_name: string;
  legal_document_short_name: string;
  legal_document_code: string;
  document_type: 'Constitución' | 'Tratado Internacional' | 'Ley Federal' | 'Constitución Local' | 'Ley Estatal' | 'Reglamento' | 'Norma Oficial Mexicana' | 'Decretos, Acuerdos y Circular Administrativa' | 'Jurisprudencia' | 'Acto Jurídico' | 'Norma Consuetudinaria';
  jurisdiction: 'Federal' | 'Estatal' | 'Municipal' | 'Internacional';
  article_references: Array<{
    article_number: string;
    section_number?: string;
    paragraph_number?: string;
  }>;
}

// Función para clasificar documentos legalmente usando LLM
async function classifyLegalDocument(text: string, fileName: string): Promise<LegalClassification> {
  if (!genAI) {
    throw new Error('La API key de Gemini no está configurada');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
Analiza el siguiente documento legal y clasifícalo según la jerarquía legal mexicana. Responde SOLO en formato JSON válido.

Documento: ${fileName}
Contenido (primeras 2000 caracteres): ${text.substring(0, 2000)}

Clasifica según estos tipos de documento:
- Constitución: Constitución Política de los Estados Unidos Mexicanos
- Tratado Internacional: Tratados internacionales de derechos humanos, etc.
- Ley Federal: Códigos Federales, Leyes Generales (Código Civil Federal, Ley Federal del Trabajo, etc.)
- Constitución Local: Constituciones de Estados y CDMX
- Ley Estatal: Códigos y Leyes Estatales (Código Civil de la CDMX, etc.)
- Reglamento: Reglamentos Federales y Estatales
- Norma Oficial Mexicana: NOMs emitidas por dependencias federales
- Decretos, Acuerdos y Circular Administrativa: Instrumentos administrativos
- Jurisprudencia: Precedentes judiciales obligatorios
- Acto Jurídico: Contratos, testamentos, convenios
- Norma Consuetudinaria: Usos y costumbres reconocidos

También extrae referencias a artículos específicos (Art. 123, Art. 1, etc.) y fracciones (Fracción I, II, etc.).

Responde en este formato JSON exacto:
{
  "hierarchy_level": 1-11,
  "legal_document_name": "Nombre completo del documento",
  "legal_document_short_name": "Nombre corto (ej: CPEUM, LFT)",
  "legal_document_code": "Código abreviado (ej: CPEUM, LFT, CCDF)",
  "document_type": "Uno de los tipos listados arriba",
  "jurisdiction": "Federal|Estatal|Municipal|Internacional",
  "article_references": [
    {
      "article_number": "123",
      "section_number": "I",
      "paragraph_number": "a"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extraer JSON de la respuesta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta del LLM');
    }
    
    const classification: LegalClassification = JSON.parse(jsonMatch[0]);
    
    // Validar que el nivel jerárquico esté en el rango correcto
    if (classification.hierarchy_level < 1 || classification.hierarchy_level > 11) {
      classification.hierarchy_level = 3; // Default a Leyes Federales
    }
    
    return classification;
  } catch (error) {
    console.error('Error al clasificar documento legal:', error);
    // Retornar clasificación por defecto
    return {
      hierarchy_level: 3,
      legal_document_name: fileName,
      legal_document_short_name: fileName.split('.')[0],
      legal_document_code: fileName.split('.')[0].toUpperCase(),
      document_type: 'Ley Federal',
      jurisdiction: 'Federal',
      article_references: []
    };
  }
}

// Función para extraer referencias de artículos del texto
function extractArticleReferences(text: string): Array<{article_number: string, section_number?: string, paragraph_number?: string}> {
  const references: Array<{article_number: string, section_number?: string, paragraph_number?: string}> = [];
  
  // Patrones para encontrar artículos
  const articlePatterns = [
    /Artículo\s+(\d+)/gi,
    /Art\.\s*(\d+)/gi,
    /Art\s+(\d+)/gi
  ];
  
  // Patrones para fracciones
  const fractionPatterns = [
    /Fracción\s+([IVX]+)/gi,
    /Fracc\.\s*([IVX]+)/gi,
    /I\.\s*([IVX]+)/gi
  ];
  
  // Buscar artículos
  articlePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      references.push({
        article_number: match[1],
        section_number: undefined,
        paragraph_number: undefined
      });
    }
  });
  
  // Buscar fracciones (asumiendo que están cerca de artículos)
  fractionPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      // Buscar el artículo más cercano
      const articleIndex = text.lastIndexOf('Artículo', text.indexOf(match[0]));
      if (articleIndex !== -1) {
        const articleMatch = text.substring(articleIndex).match(/Artículo\s+(\d+)/);
        if (articleMatch) {
          references.push({
            article_number: articleMatch[1],
            section_number: match[1],
            paragraph_number: undefined
          });
        }
      }
    }
  });
  
  return references;
}

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
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            let text = '';
            
            // Extraer texto de todas las páginas
            if (pdfData.Pages && pdfData.Pages.length > 0) {
              for (const page of pdfData.Pages) {
                if (page.Texts && page.Texts.length > 0) {
                  for (const textItem of page.Texts) {
                    if (textItem.R && textItem.R.length > 0) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          // Decodificar el texto (pdf2json usa encoding especial)
                          const decodedText = decodeURIComponent(run.T);
                          text += decodedText + ' ';
                        }
                      }
                    }
                  }
                }
              }
            }
            
            if (!text.trim()) {
              reject(new Error('No se pudo extraer texto del archivo PDF'));
              return;
            }
            
            resolve(text.trim());
          } catch (error) {
            reject(new Error('Error al procesar el contenido del PDF'));
          }
        });
        
        pdfParser.on('pdfParser_dataError', (error) => {
          reject(new Error('Error al procesar el archivo PDF. Asegúrate de que el archivo no esté corrupto.'));
        });
        
        // Procesar el buffer del PDF
        pdfParser.parseBuffer(Buffer.from(buffer));
      });
    } catch (error) {
      console.error('Error al procesar archivo PDF:', error);
      throw new Error('Error al procesar el archivo PDF. Asegúrate de que el archivo no esté corrupto y contenga texto extraíble.');
    }
  }
  
  if (file.type === 'text/plain') {
    try {
      const text = new TextDecoder().decode(buffer);
      if (!text.trim()) {
        throw new Error('El archivo de texto está vacío');
      }
      return text;
    } catch (error) {
      console.error('Error al procesar archivo de texto:', error);
      throw new Error('Error al procesar el archivo de texto. Asegúrate de que el archivo no esté corrupto.');
    }
  }
  
  throw new Error(`Tipo de archivo no soportado: ${file.type}. Solo se aceptan DOCX, PDF y TXT.`);
}

async function getEmbeddings(text: string): Promise<number[]> {
  if (!genAI) {
    throw new Error('La API key de Gemini no está configurada');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length !== 768) {
      throw new Error('El embedding generado no tiene la dimensión correcta');
    }
    
    return embedding;
  } catch (error) {
    console.error('Error al obtener embeddings de Gemini:', error);
    throw error;
  }
}

// Función optimizada para obtener embeddings en paralelo
async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!genAI) {
    throw new Error('La API key de Gemini no está configurada');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    // Procesar en lotes más pequeños para evitar rate limits
    const batchSize = 3; // Reducido de 5 a 3
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`🧠 Procesando embeddings lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      // Función para obtener embedding con retry
      const getEmbeddingWithRetry = async (text: string, retries = 3): Promise<number[]> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const result = await model.embedContent(text);
            const embedding = result.embedding.values;
            if (!embedding || embedding.length !== 768) {
              throw new Error('El embedding generado no tiene la dimensión correcta');
            }
            return embedding;
          } catch (error: any) {
            if ((error.status === 429 || error.status === 503) && attempt < retries) {
              // Rate limit o servicio no disponible, esperar más tiempo antes del siguiente intento
              const waitTime = Math.pow(2, attempt) * 1500; // 3s, 6s, 12s
              console.log(`⏳ API de Google ocupada (error ${error.status}), esperando ${waitTime}ms antes del intento ${attempt + 1}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            throw error;
          }
        }
        throw new Error(`Falló la generación de embedding después de ${retries} intentos`);
      };
      
      // Procesar el lote actual
      const batchPromises = batch.map(text => getEmbeddingWithRetry(text));
      const batchResults = await Promise.all(batchPromises);
      
      for (const embedding of batchResults) {
        results.push(embedding);
      }
      
      // Agregar delay entre lotes para evitar rate limits
      if (i + batchSize < texts.length) {
        const delay = 1000; // 1 segundo entre lotes
        console.log(`⏳ Esperando ${delay}ms antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error al obtener embeddings en lote:', error);
    throw error;
  }
}

async function chonkieChunking(text: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const py = spawn('./venv/bin/python3', ['scripts/chonkie_chunker.py']);
    let data = '';
    let error = '';
    py.stdin.write(text);
    py.stdin.end();
    py.stdout.on('data', (chunk) => {
      data += chunk;
    });
    py.stderr.on('data', (chunk) => {
      error += chunk;
    });
    py.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Error en el chunking con Chonkie'));
      } else {
        try {
          const chunks = JSON.parse(data);
          resolve(chunks);
        } catch (e) {
          reject(new Error('Error al parsear la salida de Chonkie'));
        }
      }
    });
  });
}

// Función auxiliar para dividir arrays en lotes
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'La API key de Gemini no está configurada' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userDocType = formData.get('docType') as string | null;
    const confirmed = formData.get('confirmed') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      );
    }

    // Verificar tamaño del archivo (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 10MB' },
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

    // 1. Clasificar el documento legalmente
    console.log('🏛️ Clasificando documento legalmente...');
    const legalClassification = await classifyLegalDocument(text, file.name);
    console.log('✅ Clasificación IA:', legalClassification);

    // 2. Comparar tipo de documento usuario vs IA
    let finalDocumentType = legalClassification.document_type;
    let needsConfirmation = false;
    let warningMessage = '';
    if (userDocType && userDocType !== legalClassification.document_type) {
      needsConfirmation = true;
      warningMessage = `El tipo seleccionado por el usuario ('${userDocType}') no coincide con el sugerido por la IA ('${legalClassification.document_type}'). ¿Cuál quieres guardar?`;
      finalDocumentType = userDocType;
    }

    // Si hay discrepancia y no está confirmado, solo devolver advertencia y NO procesar ni guardar nada
    if (needsConfirmation && !confirmed) {
      return NextResponse.json({
        needsConfirmation: true,
        warningMessage,
        legalClassification: {
          ...legalClassification,
          user_selected_type: userDocType,
          ia_suggested_type: legalClassification.document_type
        }
      });
    }

    // 3. Continuar con el flujo normal, procesar y guardar todo
    console.log('✂️ Generando chunks...');
    const chunks = await chonkieChunking(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No se generaron chunks del texto' },
        { status: 400 }
      );
    }

    console.log(`📊 Generados ${chunks.length} chunks`);

    // 4. Insertar documento
    const supabase = await createClient();
    const document_id = uuidv4();
    
    console.log('📝 Intentando insertar documento con datos:', {
      document_id,
      source: file.name,
      created_at: new Date().toISOString()
    });
    
    const { error: docError } = await supabase
      .from('documents')
      .insert([{
        document_id,
        source: file.name,
        created_at: new Date().toISOString()
      }]);
    
    if (docError) {
      console.error('Error detallado al insertar documento:', {
        error: docError,
        message: docError.message,
        details: docError.details,
        hint: docError.hint,
        code: docError.code
      });
      return NextResponse.json(
        { error: 'Error al guardar el documento en la base de datos', details: docError },
        { status: 500 }
      );
    }
    
    console.log('✅ Documento insertado exitosamente');

    // 4.1 Crear sección principal para el documento
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
        { error: 'Error al crear la sección principal del documento', details: sectionError },
        { status: 500 }
      );
    }

    // 5. Insertar jerarquía legal
    console.log('🏛️ Insertando jerarquía legal...');
    const hierarchy_id = uuidv4();
    const { error: hierarchyError } = await supabase
      .from('legal_hierarchy')
      .insert([{
        hierarchy_id,
        document_id,
        hierarchy_level: legalClassification.hierarchy_level,
        hierarchy_name: legalClassification.legal_document_name,
        legal_document_name: legalClassification.legal_document_name,
        legal_document_short_name: legalClassification.legal_document_short_name,
        legal_document_code: legalClassification.legal_document_code,
        document_type: finalDocumentType,
        user_selected_type: userDocType,
        ia_suggested_type: legalClassification.document_type,
        jurisdiction: legalClassification.jurisdiction,
        is_active: true
      }]);
    
    if (hierarchyError) {
      console.error('Error al insertar jerarquía legal:', hierarchyError);
      return NextResponse.json(
        { error: 'Error al clasificar el documento legalmente' },
        { status: 500 }
      );
    }

    // 6. Generar embeddings en paralelo
    console.log('🧠 Generando embeddings en paralelo...');
    const embeddings = await getEmbeddingsBatch(chunks);
    console.log(`✅ ${embeddings.length} embeddings generados`);

    // 7. Preparar datos para inserción en lotes con metadatos legales
    const chunksData = chunks.map((chunkText, index) => {
      // Extraer referencias de artículos del chunk específico
      const chunkReferences = extractArticleReferences(chunkText);
      const primaryReference = chunkReferences.length > 0 ? chunkReferences[0] : null;
      
      return {
        chunk_id: uuidv4(),
        section_id,
        chunk_text: chunkText,
        char_count: chunkText.length,
        chunk_order: index,
        // Nuevos campos de jerarquía legal
        hierarchy_id,
        legal_document_name: legalClassification.legal_document_name,
        legal_document_code: legalClassification.legal_document_code,
        article_number: primaryReference?.article_number || null,
        section_number: primaryReference?.section_number || null,
        paragraph_number: primaryReference?.paragraph_number || null,
        created_at: new Date().toISOString(),
        embedding: embeddings[index]
      };
    });

    // 8. Insertar chunks y embeddings en lotes
    console.log('💾 Insertando chunks y embeddings con metadatos legales...');
    const chunkBatches = chunkArray(chunksData, 50);
    
    for (let i = 0; i < chunkBatches.length; i++) {
      const batch = chunkBatches[i];
      
      // Insertar chunks (sin embeddings)
      const { error: chunkError } = await supabase
        .from('chunks')
        .insert(batch.map(({ embedding, ...chunk }) => chunk));
        
      if (chunkError) {
        console.error(`Error al insertar lote ${i + 1} de chunks:`, chunkError);
        return NextResponse.json(
          { error: 'Error al procesar el contenido del documento' },
          { status: 500 }
        );
      }

      // Insertar embeddings
      const { error: embError } = await supabase
        .from('embeddings')
        .insert(batch.map(({ chunk_id, embedding }, batchIndex) => ({
          vector_id: uuidv4(),
          chunk_id,
          embedding,
          embeddings_order: i * 50 + batchIndex, // Calcular el orden global
        })));
        
      if (embError) {
        console.error(`Error al insertar lote ${i + 1} de embeddings:`, embError);
        return NextResponse.json(
          { error: 'Error al generar los embeddings del documento' },
          { status: 500 }
        );
      }

      console.log(`✅ Lote ${i + 1}/${chunkBatches.length} procesado`);
    }

    console.log('🎉 Documento procesado exitosamente con jerarquía legal');
    return NextResponse.json({ 
      message: 'Documento y embeddings cargados correctamente con clasificación legal.',
      chunksProcessed: chunks.length,
      embeddingsGenerated: embeddings.length,
      legalClassification: {
        hierarchy_level: legalClassification.hierarchy_level,
        legal_document_name: legalClassification.legal_document_name,
        legal_document_code: legalClassification.legal_document_code,
        document_type: finalDocumentType,
        user_selected_type: userDocType,
        ia_suggested_type: legalClassification.document_type,
        jurisdiction: legalClassification.jurisdiction
      },
      needsConfirmation: false,
      warningMessage: ''
    });
  } catch (e: any) {
    console.error('Error en el endpoint /api/upload:', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 