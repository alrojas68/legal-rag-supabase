#!/bin/bash

# Script completo para optimizar y reconstruir la base de datos
echo "🚀 Iniciando optimización y reconstrucción de la base de datos..."

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: No se encontró supabase/config.toml. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# 1. Limpiar la base de datos actual
echo "🧹 Paso 1: Limpiando base de datos actual..."
./scripts/clean-database.sh

# 2. Aplicar la nueva estructura optimizada
echo "🔧 Paso 2: Aplicando estructura optimizada..."
supabase db reset --linked

# 3. Ejecutar el script de optimización
echo "⚡ Paso 3: Ejecutando script de optimización..."
psql $DATABASE_URL -f scripts/optimize-database.sql

# 4. Verificar que la estructura se creó correctamente
echo "✅ Paso 4: Verificando estructura..."
psql $DATABASE_URL -c "SELECT get_database_stats();"

echo "🎉 ¡Base de datos optimizada y lista!"
echo ""
echo "📋 Cambios realizados:"
echo "  ✅ Estructura simplificada (sin sections)"
echo "  ✅ Chunks de 512 tokens (en lugar de 1024)"
echo "  ✅ Campos NULL eliminados"
echo "  ✅ Índices optimizados"
echo "  ✅ Función match_documents mejorada"
echo ""
echo "🔄 Ahora puedes subir documentos y deberías ver:"
echo "  - 1 documento por archivo (no 9)"
echo "  - Mejor precisión en búsquedas"
echo "  - Respuestas más específicas de Gemini" 