#!/bin/bash

# Script para limpiar completamente la base de datos
echo "🧹 Limpiando base de datos..."

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: No se encontró supabase/config.toml. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Ejecutar el script SQL de limpieza
echo "📝 Ejecutando script de limpieza..."
supabase db reset --linked

# Alternativa si no tienes Supabase CLI configurado:
# echo "📝 Ejecutando script de limpieza manualmente..."
# psql $DATABASE_URL -f scripts/clean-database.sql

echo "✅ Base de datos limpiada exitosamente!"
echo "🔄 Ahora puedes recrear los chunks con el nuevo tamaño de 512 tokens" 