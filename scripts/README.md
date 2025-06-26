# Scripts de procesamiento de documentos

## chonkie_chunker.py

Este script recibe texto por stdin y devuelve los chunks semánticos en formato JSON usando la librería Chonkie (chunk_size=256, overlap=50). Es invocado automáticamente por el backend al cargar documentos.

### Uso manual

```bash
echo "Texto legal aquí..." | python scripts/chonkie_chunker.py
```

### Requisitos
- Python 3.8+
- chonkie

Instala dependencias con:
```bash
pip install chonkie
``` 