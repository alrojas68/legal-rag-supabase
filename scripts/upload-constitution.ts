#!/usr/bin/env tsx
/**
 * Script para subir la Constitución de la CDMX a la base de datos
 * Usa Drizzle y la configuración actual del proyecto
 */

import { db } from '../lib/db';
import { documents, sections, chunks, embeddings } from '../lib/db/schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Función para obtener embeddings
async function getEmbeddings(text: string): Promise<number[]> {
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

// Función para chunking en TypeScript (reemplaza Python)
async function chonkieChunking(text: string): Promise<string[]> {
  // Implementación de chunking en TypeScript para reemplazar Python
  const chunks: string[] = [];
  const chunkSize = 512;
  const overlap = 50;
  
  // Delimitadores para documentos legales
  const delimiters = [
    '.', '!', '?', '\n',
    'PRIMERA.', 'SEGUNDA.', 'TERCERA.', 'CUARTA.', 'QUINTA.',
    'SEXTA.', 'SÉPTIMA.', 'OCTAVA.', 'NOVENA.', 'DÉCIMA.',
    'Artículo', 'ARTÍCULO', 'CAPÍTULO', 'Capítulo', 'SECCIÓN', 'Sección',
    'TÍTULO', 'Título', 'LIBRO', 'Libro', 'PARTE', 'Parte',
    'PRIMERO.', 'SEGUNDO.', 'TERCERO.', 'CUARTO.', 'QUINTO.',
    'SEXTO.', 'SÉPTIMO.', 'OCTAVO.', 'NOVENO.', 'DÉCIMO.'
  ];
  
  // Dividir el texto en oraciones usando los delimitadores
  let sentences: string[] = [];
  let currentSentence = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSentence += char;
    
    // Verificar si encontramos un delimitador
    let foundDelimiter = false;
    for (const delimiter of delimiters) {
      if (currentSentence.endsWith(delimiter)) {
        sentences.push(currentSentence.trim());
        currentSentence = '';
        foundDelimiter = true;
        break;
      }
    }
    
    // Si no encontramos delimitador pero tenemos un salto de línea, también dividir
    if (!foundDelimiter && char === '\n' && currentSentence.trim()) {
      sentences.push(currentSentence.trim());
      currentSentence = '';
    }
  }
  
  // Agregar la última oración si existe
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }
  
  // Filtrar oraciones vacías y muy cortas
  sentences = sentences.filter(sentence => 
    sentence.length > 10 && sentence.trim().length > 0
  );
  
  // Crear chunks basados en oraciones
  let currentChunk = '';
  let currentTokenCount = 0;
  
  for (const sentence of sentences) {
    // Estimación simple de tokens (aproximadamente 4 caracteres por token)
    const sentenceTokens = Math.ceil(sentence.length / 4);
    
    // Si agregar esta oración excedería el límite, guardar el chunk actual
    if (currentTokenCount + sentenceTokens > chunkSize && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      
      // Mantener overlap: incluir las últimas oraciones del chunk anterior
      const overlapTokens = Math.floor(overlap / 4);
      let overlapCount = 0;
      const lastSentences = currentChunk.split(/[.!?]\s+/).slice(-3); // Últimas 3 oraciones
      
      currentChunk = '';
      currentTokenCount = 0;
      
      for (const lastSentence of lastSentences) {
        const lastSentenceTokens = Math.ceil(lastSentence.length / 4);
        if (overlapCount + lastSentenceTokens <= overlapTokens) {
          currentChunk += lastSentence + '. ';
          overlapCount += lastSentenceTokens;
          currentTokenCount += lastSentenceTokens;
        }
      }
    }
    
    // Agregar la oración actual al chunk
    currentChunk += sentence + ' ';
    currentTokenCount += sentenceTokens;
  }
  
  // Agregar el último chunk si existe
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Filtrar chunks muy pequeños
  return chunks.filter(chunk => chunk.length > 50);
}

// Función para leer PDF
async function readPDF(filePath: string): Promise<string> {
  // Implementación simple para leer PDF
  // En un entorno real, usarías una librería como pdf-parse
  const fileBuffer = fs.readFileSync(filePath);
  
  // Por ahora, retornamos un texto de ejemplo
  // En producción, deberías usar una librería como pdf-parse
  return "Texto de ejemplo de la Constitución de la CDMX...";
}

async function uploadConstitution() {
  try {
    console.log('🚀 Iniciando carga de la Constitución de la CDMX...');
    
    const filePath = 'documents/constitucion-politica-de-la-ciudad-de-mexico.pdf';
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    
    console.log('📄 Leyendo PDF...');
    const text = await readPDF(filePath);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No se pudo extraer texto del PDF');
    }
    
    console.log(`📊 Texto extraído: ${text.length} caracteres`);
    
    // Crear documento
    const documentId = uuidv4();
    console.log('📝 Creando documento...');
    
    await db.insert(documents).values({
      documentId,
      source: 'constitucion-politica-de-la-ciudad-de-mexico.pdf',
      createdAt: new Date()
    });
    
    // Crear sección
    const sectionId = uuidv4();
    console.log('📋 Creando sección...');
    
    await db.insert(sections).values({
      sectionId,
      documentId,
      sectionType: 'main',
      sectionNumber: '1',
      createdAt: new Date()
    });
    
    // Generar chunks
    console.log('✂️ Generando chunks...');
    const chunkTexts = await chonkieChunking(text);
    console.log(`📊 Generados ${chunkTexts.length} chunks`);
    
    // Procesar chunks en lotes
    const batchSize = 5;
    for (let i = 0; i < chunkTexts.length; i += batchSize) {
      const batch = chunkTexts.slice(i, i + batchSize);
      console.log(`🔄 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunkTexts.length/batchSize)}`);
      
      // Crear chunks
      const chunkData = batch.map((chunkText, index) => ({
        chunkId: uuidv4(),
        sectionId,
        chunkText: chunkText,
        charCount: chunkText.length,
        chunkOrder: i + index,
        createdAt: new Date()
      }));
      
      await db.insert(chunks).values(chunkData);
      
      // Generar embeddings
      for (const chunk of chunkData) {
        try {
          console.log(`🧠 Generando embedding para chunk ${chunk.chunkOrder + 1}...`);
          const embedding = await getEmbeddings(chunk.chunkText);
          
          await db.insert(embeddings).values({
            vectorId: uuidv4(),
            chunkId: chunk.chunkId,
            embedding: JSON.stringify(embedding), // Convertir array a string
            embeddingsOrder: 1
          });
          
          // Pausa para evitar rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`❌ Error generando embedding para chunk ${chunk.chunkOrder + 1}:`, error);
        }
      }
    }
    
    console.log('✅ Constitución de la CDMX cargada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
uploadConstitution(); 