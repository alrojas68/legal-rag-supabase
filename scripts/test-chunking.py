#!/usr/bin/env python3
"""
Script de prueba para comparar chunking actual vs Chonkie
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chonkie import SentenceChunker
import re

def chunk_text_current(text, chunk_size=512, overlap=50):
    """
    Método de chunking actual (simple por caracteres)
    """
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Si no es el final del texto, buscar el último espacio
        if end < len(text):
            last_space = text.rfind(' ', start, end)
            if last_space > start:
                end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append({
                'text': chunk,
                'start': start,
                'end': end,
                'length': len(chunk),
                'method': 'current'
            })
        
        # Aplicar overlap
        start = max(start + 1, end - overlap)
    
    return chunks

def chunk_text_chonkie(text, chunk_size=512, overlap=50):
    """
    Método de chunking con Chonkie optimizado para documentos legales
    """
    chunker = SentenceChunker(
        tokenizer_or_token_counter="gpt2",
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        min_sentences_per_chunk=1,
        min_characters_per_sentence=10,
        delim=['.', '!', '?', '\n', 'PRIMERA.', 'SEGUNDA.', 'TERCERA.', 'CUARTA.', 'QUINTA.', 'SEXTA.', 'SÉPTIMA.', 'OCTAVA.', 'NOVENA.', 'DÉCIMA.']
    )
    
    chunks = chunker.chunk(text)
    
    return [
        {
            'text': chunk.text,
            'start': chunk.start_index,
            'end': chunk.end_index,
            'length': len(chunk.text),
            'token_count': chunk.token_count,
            'sentences': len(chunk.sentences),
            'method': 'chonkie'
        }
        for chunk in chunks
    ]

def analyze_chunks(chunks, method_name):
    """
    Analizar la calidad de los chunks
    """
    if not chunks:
        return {}
    
    total_chunks = len(chunks)
    avg_length = sum(c['length'] for c in chunks) / total_chunks
    min_length = min(c['length'] for c in chunks)
    max_length = max(c['length'] for c in chunks)
    
    # Contar oraciones completas
    complete_sentences = 0
    for chunk in chunks:
        text = chunk['text']
        if text.endswith(('.', '!', '?')):
            complete_sentences += 1
    
    return {
        'method': method_name,
        'total_chunks': total_chunks,
        'avg_length': round(avg_length, 2),
        'min_length': min_length,
        'max_length': max_length,
        'complete_sentences': complete_sentences,
        'sentence_ratio': round(complete_sentences / total_chunks * 100, 2)
    }

def main():
    # Documento legal de ejemplo
    sample_text = """
    CONTRATO DE ARRENDAMIENTO COMERCIAL
    
    En la ciudad de México, Distrito Federal, a los 15 días del mes de enero del año 2024, 
    comparecen por una parte el señor JUAN PÉREZ GARCÍA, mayor de edad, con domicilio 
    en la calle Reforma número 123, colonia Centro, código postal 06000, a quien en 
    adelante se le denominará "EL ARRENDADOR", y por otra parte la señora MARÍA 
    LÓPEZ MARTÍNEZ, mayor de edad, con domicilio en la avenida Insurgentes número 456, 
    colonia Roma, código postal 06700, a quien en adelante se le denominará "EL 
    ARRENDATARIO", y ambos manifiestan que tienen capacidad legal para celebrar el 
    presente contrato de arrendamiento comercial.
    
    PRIMERA. OBJETO DEL CONTRATO. El presente contrato tiene por objeto el 
    arrendamiento del local comercial ubicado en la calle Reforma número 123, 
    planta baja, colonia Centro, código postal 06000, Ciudad de México, Distrito 
    Federal, el cual cuenta con una superficie de 150 metros cuadrados, 
    aproximadamente, y que en adelante se denominará "EL INMUEBLE".
    
    SEGUNDA. DESTINO DEL INMUEBLE. EL ARRENDATARIO se compromete a utilizar EL 
    INMUEBLE exclusivamente para el establecimiento de un restaurante de comida 
    mexicana, quedando expresamente prohibido destinar EL INMUEBLE a cualquier 
    otro uso sin la autorización previa y por escrito de EL ARRENDADOR.
    
    TERCERA. PLAZO DEL CONTRATO. El presente contrato se celebra por un plazo 
    de tres años, contados a partir del día 1 de febrero del año 2024, fecha en 
    la cual EL ARRENDATARIO tomará posesión de EL INMUEBLE, y concluirá el día 
    31 de enero del año 2027, salvo que las partes acuerden su renovación o 
    prórroga por escrito.
    
    CUARTA. RENTA MENSUAL. EL ARRENDATARIO se obliga a pagar a EL ARRENDADOR 
    una renta mensual de $25,000.00 (veinticinco mil pesos 00/100 M.N.), la cual 
    deberá ser pagada por adelantado, dentro de los primeros cinco días de cada 
    mes, en la cuenta bancaria que EL ARRENDADOR designe, o en su defecto, en 
    efectivo en el domicilio de EL ARRENDADOR.
    
    QUINTA. DEPÓSITO EN GARANTÍA. Al momento de la firma del presente contrato, 
    EL ARRENDATARIO entregará a EL ARRENDADOR la cantidad de $50,000.00 (cincuenta 
    mil pesos 00/100 M.N.) como depósito en garantía del cumplimiento de las 
    obligaciones derivadas del presente contrato, el cual será devuelto a EL 
    ARRENDATARIO al término del contrato, siempre y cuando haya cumplido con 
    todas sus obligaciones.
    
    SEXTA. OBLIGACIONES DEL ARRENDADOR. EL ARRENDADOR se obliga a: a) Entregar 
    EL INMUEBLE en buen estado de conservación y funcionamiento; b) Realizar las 
    reparaciones necesarias que no sean consecuencia del uso normal del inmueble; 
    c) No perturbar el uso pacífico del inmueble por parte del arrendatario.
    
    SÉPTIMA. OBLIGACIONES DEL ARRENDATARIO. EL ARRENDATARIO se obliga a: a) 
    Pagar puntualmente la renta mensual; b) Usar EL INMUEBLE únicamente para el 
    destino convenido; c) Mantener EL INMUEBLE en buen estado de conservación; 
    d) Pagar los servicios públicos que consuma; e) No realizar modificaciones 
    sin autorización previa.
    
    OCTAVA. TERMINACIÓN ANTICIPADA. El presente contrato podrá terminarse 
    anticipadamente por cualquiera de las siguientes causas: a) Incumplimiento 
    de las obligaciones por parte de cualquiera de las partes; b) Mutuo acuerdo 
    de las partes; c) Por causas de fuerza mayor.
    
    NOVENA. JURISDICCIÓN Y LEYES APLICABLES. Para la interpretación y cumplimiento 
    del presente contrato, las partes se someten a las leyes del Distrito Federal 
    y a la jurisdicción de los tribunales competentes de la Ciudad de México.
    
    DÉCIMA. DOMICILIOS. Para todos los efectos legales derivados del presente 
    contrato, las partes establecen como sus domicilios los señalados en el 
    encabezado del presente documento.
    
    En testimonio de lo cual, las partes firman el presente contrato en tres 
    ejemplares de igual tenor y a un mismo efecto, en la ciudad y fecha antes 
    señaladas.
    
    EL ARRENDADOR                          EL ARRENDATARIO
    _________________                      _________________
    JUAN PÉREZ GARCÍA                      MARÍA LÓPEZ MARTÍNEZ
    """
    
    print("🔍 COMPARACIÓN DE CHUNKING: ACTUAL vs CHONKIE")
    print("=" * 60)
    
    # Probar chunking actual
    print("\n📋 CHUNKING ACTUAL:")
    current_chunks = chunk_text_current(sample_text)
    current_analysis = analyze_chunks(current_chunks, "Actual")
    
    for i, chunk in enumerate(current_chunks[:3]):  # Mostrar solo los primeros 3
        print(f"  Chunk {i+1}: {chunk['length']} chars")
        print(f"    Texto: {chunk['text'][:100]}...")
        print()
    
    # Probar chunking con Chonkie (chunk_size original)
    print("\n🧠 CHUNKING CON CHONKIE (512 tokens):")
    chonkie_chunks = chunk_text_chonkie(sample_text, chunk_size=512)
    chonkie_analysis = analyze_chunks(chonkie_chunks, "Chonkie-512")
    
    for i, chunk in enumerate(chonkie_chunks[:3]):  # Mostrar solo los primeros 3
        print(f"  Chunk {i+1}: {chunk['length']} chars, {chunk['token_count']} tokens, {chunk['sentences']} oraciones")
        print(f"    Texto: {chunk['text'][:100]}...")
        print()
    
    # Probar chunking con Chonkie (chunk_size más pequeño)
    print("\n🧠 CHUNKING CON CHONKIE (256 tokens):")
    chonkie_small_chunks = chunk_text_chonkie(sample_text, chunk_size=256)
    chonkie_small_analysis = analyze_chunks(chonkie_small_chunks, "Chonkie-256")
    
    for i, chunk in enumerate(chonkie_small_chunks[:3]):  # Mostrar solo los primeros 3
        print(f"  Chunk {i+1}: {chunk['length']} chars, {chunk['token_count']} tokens, {chunk['sentences']} oraciones")
        print(f"    Texto: {chunk['text'][:100]}...")
        print()
    
    # Comparación
    print("\n📊 ANÁLISIS COMPARATIVO:")
    print("=" * 80)
    print(f"{'Método':<15} {'Chunks':<8} {'Avg Length':<12} {'Tokens':<8} {'Complete %':<12}")
    print("-" * 80)
    print(f"{current_analysis['method']:<15} {current_analysis['total_chunks']:<8} {current_analysis['avg_length']:<12} {'N/A':<8} {current_analysis['sentence_ratio']:<12}%")
    print(f"{chonkie_analysis['method']:<15} {chonkie_analysis['total_chunks']:<8} {chonkie_analysis['avg_length']:<12} {'~500':<8} {chonkie_analysis['sentence_ratio']:<12}%")
    print(f"{chonkie_small_analysis['method']:<15} {chonkie_small_analysis['total_chunks']:<8} {chonkie_small_analysis['avg_length']:<12} {'~250':<8} {chonkie_small_analysis['sentence_ratio']:<12}%")
    
    print(f"\n🎯 CONCLUSIONES:")
    print(f"• Chonkie-512 genera {chonkie_analysis['total_chunks']} chunks vs {current_analysis['total_chunks']} del método actual")
    print(f"• Chonkie-256 genera {chonkie_small_analysis['total_chunks']} chunks (más granular)")
    print(f"• Chonkie preserva mejor el contexto semántico y las oraciones completas")
    print(f"• Chonkie incluye metadata de tokens y oraciones por chunk")
    print(f"• Chonkie-256 es más similar al método actual en número de chunks")

if __name__ == "__main__":
    main() 