import os
from typing import List
import google.generativeai as genai

# Configurar la API key
api_key = os.environ.get('GOOGLE_API_KEY')
if not api_key:
    raise ValueError('GOOGLE_API_KEY no está configurada en las variables de entorno')

genai.configure(api_key=api_key)

def get_embeddings(text: str) -> List[float]:
    """
    Generar embeddings usando el modelo embedding-001 de Gemini
    """
    try:
        # Usar la función embed_content directamente
        result = genai.embed_content(
            model='models/embedding-001',
            content=text
        )
        embedding = result['embedding']
        
        if not embedding or len(embedding) != 768:
            raise ValueError('El embedding generado no tiene la dimensión correcta (768)')
        
        return embedding
        
    except Exception as error:
        print(f'Error al obtener embeddings de Gemini: {error}')
        raise error 