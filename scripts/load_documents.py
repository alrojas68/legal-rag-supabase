#!/usr/bin/env python3
"""
Script para cargar documentos legales a la base de datos con embeddings
"""

import os
import sys
import uuid
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any
import PyPDF2
import re

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chonkie import SentenceChunker
from lib.supabase.client import create_client
from lib.gemini import get_embeddings

class DocumentLoader:
    def __init__(self):
        self.supabase = create_client()
        self.chunker = SentenceChunker(
            tokenizer_or_token_counter="gpt2",
            chunk_size=512,
            chunk_overlap=50,
            min_sentences_per_chunk=1,
            min_characters_per_sentence=10,
            delim=['.', '!', '?', '\n', 'PRIMERA.', 'SEGUNDA.', 'TERCERA.', 'CUARTA.', 'QUINTA.', 'SEXTA.', 'SÉPTIMA.', 'OCTAVA.', 'NOVENA.', 'DÉCIMA.']
        )
    
    def read_text_file(self, file_path: str) -> str:
        """Leer archivo de texto"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Intentar con encoding diferente
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
    
    def read_pdf_file(self, file_path: str) -> str:
        """Leer archivo PDF"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error leyendo PDF {file_path}: {e}")
        return text
    
    def clean_text(self, text: str) -> str:
        """Limpiar y normalizar texto"""
        # Remover caracteres extraños
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}\"\'\n]', ' ', text)
        # Normalizar espacios
        text = re.sub(r'\s+', ' ', text)
        # Normalizar saltos de línea
        text = re.sub(r'\n+', '\n', text)
        return text.strip()
    
    def chunk_document(self, text: str) -> List[Dict[str, Any]]:
        """Chunkear documento usando Chonkie"""
        if not text.strip():
            return []
        
        chunks = self.chunker.chunk(text)
        return [
            {
                'text': chunk.text,
                'start_index': chunk.start_index,
                'end_index': chunk.end_index,
                'token_count': chunk.token_count,
                'sentences': len(chunk.sentences)
            }
            for chunk in chunks if chunk.text.strip()
        ]
    
    def create_document(self, source: str) -> str:
        """Crear documento en la base de datos"""
        document_id = str(uuid.uuid4())
        
        try:
            result = self.supabase.table('documents').insert({
                'document_id': document_id,
                'source': source
            }).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f"Error creando documento {source}: {result.error}")
                return None
            
            print(f"✅ Documento creado: {source}")
            return document_id
            
        except Exception as e:
            print(f"Error creando documento {source}: {e}")
            return None
    
    def create_section(self, document_id: str, section_type: str = "main") -> str:
        """Crear sección en la base de datos"""
        section_id = str(uuid.uuid4())
        
        try:
            result = self.supabase.table('sections').insert({
                'section_id': section_id,
                'document_id': document_id,
                'section_type': section_type,
                'section_number': '1'
            }).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f"Error creando sección: {result.error}")
                return None
            
            return section_id
            
        except Exception as e:
            print(f"Error creando sección: {e}")
            return None
    
    def create_chunk(self, section_id: str, chunk_data: dict) -> str:
        """Crear chunk en la base de datos"""
        chunk_id = str(uuid.uuid4())
        
        try:
            result = self.supabase.table('chunks').insert({
                'chunk_id': chunk_id,
                'section_id': section_id,
                'chunk_text': chunk_data['text'],
                'char_count': len(chunk_data['text']),
                'start_page': 1,  # Por defecto
                'end_page': 1     # Por defecto
            }).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f"Error creando chunk: {result.error}")
                return None
            
            return chunk_id
            
        except Exception as e:
            print(f"Error creando chunk: {e}")
            return None
    
    def create_embedding(self, chunk_id: str, embedding: list) -> str:
        """Crear embedding en la base de datos"""
        vector_id = str(uuid.uuid4())
        
        try:
            result = self.supabase.table('embeddings').insert({
                'vector_id': vector_id,
                'chunk_id': chunk_id,
                'embedding': embedding,
                'embeddings_order': 1
            }).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f"Error creando embedding: {result.error}")
                return None
            
            # Actualizar el vector_id en la tabla chunks
            update_result = self.supabase.table('chunks').update({
                'vector_id': vector_id
            }).eq('chunk_id', chunk_id).execute()
            
            if hasattr(update_result, 'error') and update_result.error:
                print(f"Error actualizando chunk con vector_id: {update_result.error}")
            
            return vector_id
            
        except Exception as e:
            print(f"Error creando embedding: {e}")
            return None
    
    def get_embedding_with_retry(self, text: str, max_retries: int = 3) -> List[float]:
        """Obtener embedding con reintentos automáticos"""
        for attempt in range(max_retries):
            try:
                embedding = get_embeddings(text)
                if embedding:
                    return embedding
                else:
                    print(f"    ⚠️ No se pudo generar embedding (intento {attempt + 1})")
                    
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "quota" in error_str.lower():
                    wait_time = (attempt + 1) * 2  # Espera exponencial: 2s, 4s, 6s
                    print(f"    ⏳ Rate limit alcanzado. Esperando {wait_time}s... (intento {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    print(f"    ❌ Error generando embedding: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1)
        
        return None
    
    def process_document(self, file_path: str):
        """Procesar un documento completo"""
        file_path = Path(file_path)
        source = file_path.name
        
        print(f"\n📄 Procesando: {source}")
        
        # Leer documento
        if file_path.suffix.lower() == '.pdf':
            text = self.read_pdf_file(str(file_path))
        else:
            text = self.read_text_file(str(file_path))
        
        if not text.strip():
            print(f"⚠️ Documento vacío: {source}")
            return
        
        # Limpiar texto
        text = self.clean_text(text)
        print(f"📊 Texto extraído: {len(text)} caracteres")
        
        # Crear documento
        document_id = self.create_document(source)
        if not document_id:
            return
        
        # Crear sección
        section_id = self.create_section(document_id)
        if not section_id:
            return
        
        # Chunkear documento
        chunks = self.chunk_document(text)
        print(f"🔪 Chunks creados: {len(chunks)}")
        
        # Procesar cada chunk
        for i, chunk_data in enumerate(chunks):
            print(f"  Procesando chunk {i+1}/{len(chunks)}...")
            
            # Crear chunk
            chunk_id = self.create_chunk(section_id, chunk_data)
            if not chunk_id:
                continue
            
            # Generar embedding con reintentos
            try:
                embedding = self.get_embedding_with_retry(chunk_data['text'])
                if embedding:
                    self.create_embedding(chunk_id, embedding)
                    print(f"    ✅ Embedding creado")
                else:
                    print(f"    ⚠️ No se pudo generar embedding después de reintentos")
                
                # Pausa entre requests para evitar rate limits
                time.sleep(1.5)  # 1.5 segundos entre cada embedding
                
            except Exception as e:
                print(f"    ❌ Error generando embedding: {e}")
        
        print(f"✅ Documento procesado: {source}")
    
    def load_all_documents(self, documents_dir: str = "documents"):
        """Cargar todos los documentos del directorio"""
        documents_path = Path(documents_dir)
        
        if not documents_path.exists():
            print(f"❌ Directorio {documents_dir} no existe")
            return
        
        # Encontrar todos los archivos
        files = []
        for ext in ['*.pdf', '*.txt', '*.doc', '*.docx']:
            files.extend(documents_path.glob(ext))
        
        if not files:
            print(f"❌ No se encontraron documentos en {documents_dir}")
            return
        
        print(f"📚 Encontrados {len(files)} documentos para procesar")
        
        # Procesar cada documento
        for file_path in files:
            self.process_document(file_path)
        
        print(f"\n🎉 Proceso completado! {len(files)} documentos procesados")

def main():
    """Función principal"""
    print("�� Iniciando carga de la Constitución de la CDMX...")
    
    loader = DocumentLoader()
    
    # Procesar solo el archivo específico
    file_path = "documents/constitucion-politica-de-la-ciudad-de-mexico.pdf"
    
    if not os.path.exists(file_path):
        print(f"❌ Archivo no encontrado: {file_path}")
        return
    
    print(f"📄 Procesando: {file_path}")
    loader.process_document(file_path)
    print("✅ Constitución de la CDMX procesada exitosamente!")

if __name__ == "__main__":
    main() 