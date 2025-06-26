#!/usr/bin/env python3
import sys
import json
from chonkie import SentenceChunker

def main():
    text = sys.stdin.read()
    chunker = SentenceChunker(
        tokenizer_or_token_counter="gpt2",
        chunk_size=512,
        chunk_overlap=50,
        min_sentences_per_chunk=2,
        min_characters_per_sentence=10,
        delim=[
            '.', '!', '?', '\n', 
            'PRIMERA.', 'SEGUNDA.', 'TERCERA.', 'CUARTA.', 'QUINTA.', 
            'SEXTA.', 'SÉPTIMA.', 'OCTAVA.', 'NOVENA.', 'DÉCIMA.',
            'Artículo', 'ARTÍCULO', 'CAPÍTULO', 'Capítulo', 'SECCIÓN', 'Sección',
            'TÍTULO', 'Título', 'LIBRO', 'Libro', 'PARTE', 'Parte',
            'PRIMERO.', 'SEGUNDO.', 'TERCERO.', 'CUARTO.', 'QUINTO.',
            'SEXTO.', 'SÉPTIMO.', 'OCTAVO.', 'NOVENO.', 'DÉCIMO.'
        ]
    )
    chunks = chunker.chunk(text)
    out = [chunk.text for chunk in chunks]
    print(json.dumps(out, ensure_ascii=False))

if __name__ == "__main__":
    main() 