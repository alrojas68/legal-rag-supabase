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
import { spawn } from 'child_process';

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

// Función para chunking usando el script de Python
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

// Función para leer PDF
async function readPDF(filePath: string): Promise<string> {
  // Usar el mismo parser que tu API
  const { parseFile } = await import('../app/api/upload/route');
  
  // Crear un objeto File simulado
  const fileBuffer = fs.readFileSync(filePath);
  const file = new File([fileBuffer], path.basename(filePath), {
    type: 'application/pdf'
  });
  
  return parseFile(file);
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
    const document_id = uuidv4();
    console.log('📝 Creando documento...');
    
    await db.insert(documents).values({
      document_id,
      source: 'constitucion-politica-de-la-ciudad-de-mexico.pdf',
      created_at: new Date()
    });
    
    // Crear sección
    const section_id = uuidv4();
    console.log('📋 Creando sección...');
    
    await db.insert(sections).values({
      section_id,
      document_id,
      section_type: 'main',
      section_number: '1',
      created_at: new Date()
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
        chunk_id: uuidv4(),
        section_id,
        chunk_text: chunkText,
        char_count: chunkText.length,
        chunk_order: i + index,
        created_at: new Date()
      }));
      
      await db.insert(chunks).values(chunkData);
      
      // Generar embeddings
      for (const chunk of chunkData) {
        try {
          console.log(`🧠 Generando embedding para chunk ${chunk.chunk_order + 1}...`);
          const embedding = await getEmbeddings(chunk.chunk_text);
          
          await db.insert(embeddings).values({
            vector_id: uuidv4(),
            chunk_id: chunk.chunk_id,
            embedding,
            embeddings_order: 1
          });
          
          // Pausa para evitar rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`❌ Error generando embedding para chunk ${chunk.chunk_order + 1}:`, error);
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