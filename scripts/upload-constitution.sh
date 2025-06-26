#!/bin/bash

# Cargar variables de entorno
set -a
source .env.local
set +a

echo "🚀 Iniciando carga de la Constitución de la CDMX..."
echo "📄 Archivo: documents/constitucion-politica-de-la-ciudad-de-mexico.pdf"

# Verificar que el archivo existe
if [ ! -f "documents/constitucion-politica-de-la-ciudad-de-mexico.pdf" ]; then
    echo "❌ Error: Archivo no encontrado"
    exit 1
fi

# Ejecutar el script de Python
python3 scripts/load_documents.py

echo "✅ Proceso completado!" 