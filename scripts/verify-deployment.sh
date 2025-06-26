#!/bin/bash

echo "🔍 Verificando configuración para deployment en Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que Next.js esté instalado
if ! grep -q "next" package.json; then
    echo "❌ Error: Next.js no está en las dependencias."
    exit 1
fi

# Verificar que el script de build existe
if ! grep -q "\"build\":" package.json; then
    echo "❌ Error: Script de build no encontrado en package.json."
    exit 1
fi

# Verificar archivos de configuración
echo "📋 Verificando archivos de configuración..."

if [ ! -f "next.config.ts" ]; then
    echo "❌ Error: next.config.ts no encontrado."
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json no encontrado."
    exit 1
fi

# Verificar que las migraciones de Supabase estén presentes
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: Directorio de migraciones de Supabase no encontrado."
    exit 1
fi

# Verificar variables de entorno requeridas
echo "🔐 Verificando variables de entorno..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "GOOGLE_GEMINI_API_KEY"
    "NEXT_PUBLIC_APP_URL"
)

echo "⚠️  Asegúrate de configurar estas variables en Vercel:"
for var in "${REQUIRED_VARS[@]}"; do
    echo "   - $var"
done

# Verificar que el proyecto se puede construir
echo "🔨 Verificando que el proyecto se puede construir..."

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Intentar construir el proyecto
echo "🏗️  Construyendo el proyecto..."
if npm run build; then
    echo "✅ Construcción exitosa!"
else
    echo "❌ Error en la construcción. Revisa los errores arriba."
    exit 1
fi

echo ""
echo "🎉 ¡Todo listo para deployment en Vercel!"
echo ""
echo "📝 Pasos siguientes:"
echo "1. Conecta tu repositorio a Vercel"
echo "2. Configura las variables de entorno en el dashboard de Vercel"
echo "3. Despliega automáticamente en cada push"
echo ""
echo "🔗 Variables de entorno necesarias en Vercel:"
for var in "${REQUIRED_VARS[@]}"; do
    echo "   $var"
done 