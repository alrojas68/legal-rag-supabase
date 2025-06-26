# 🏛️ Legal RAG - Asistente Legal Inteligente Avanzado

<div align="center">
  <img src="app/opengraph-image.png" alt="Legal RAG Logo" width="400"/>
  <h3>Sistema de Recuperación y Generación de Respuestas Legales con IA Híbrida</h3>
</div>

<p align="center">
  <a href="#características"><strong>Características</strong></a> •
  <a href="#búsqueda-híbrida"><strong>Búsqueda Híbrida</strong></a> •
  <a href="#tecnologías"><strong>Tecnologías</strong></a> •
  <a href="#instalación"><strong>Instalación</strong></a> •
  <a href="#uso"><strong>Uso</strong></a> •
  <a href="#arquitectura"><strong>Arquitectura</strong></a> •
  <a href="#despliegue"><strong>Despliegue</strong></a>
</p>

---

## 🚀 Características

### ✨ Funcionalidades Principales
- **Chat Legal Inteligente**: Conversaciones con IA especializada en derecho mexicano
- **Búsqueda Híbrida Avanzada**: Combinación de búsqueda vectorial (semántica) y BM25 (texto completo)
- **Comparación de Métodos**: Visualización en tiempo real de resultados de ambos métodos
- **Respuesta Combinada**: Generación de respuestas usando los mejores resultados de ambos métodos
- **Artículos Referenciados**: Resumen automático de artículos legales con ordenamiento por relevancia
- **Chunking Semántico**: Procesamiento inteligente de documentos con [Chonkie](https://docs.chonkie.ai/)
- **Autenticación Segura**: Sistema de usuarios con Supabase Auth
- **Carga de Documentos**: Soporte para PDF, DOCX y archivos de texto
- **Historial de Conversaciones**: Persistencia de chats por usuario
- **Citas Legales**: Referencias automáticas a artículos constitucionales y leyes
- **Interfaz Moderna**: UI responsive con tema claro/oscuro

### 🔍 Búsqueda Híbrida Inteligente
- **Búsqueda Vectorial (Semántica)**: Similitud semántica con embeddings de Google Gemini
- **Búsqueda BM25 (Texto Completo)**: Coincidencia de términos específicos con índices de texto completo
- **Comparación Visual**: Resultados de ambos métodos mostrados lado a lado
- **Respuesta Combinada**: Integración inteligente de ambos métodos para respuestas más completas
- **Artículos Referenciados**: Extracción automática y ordenamiento por relevancia

### 📊 Análisis Comparativo
- **Comparación de Métodos**: Visualización de resultados vectoriales vs BM25
- **Scores de Relevancia**: Puntuaciones de similitud y ranking para cada resultado
- **Deduplicación Inteligente**: Eliminación de resultados duplicados entre métodos
- **Ordenamiento por Relevancia**: Artículos ordenados por doble match y score descendente

### 📚 Procesamiento de Documentos
- **Chunking Semántico**: División inteligente preservando contexto legal
- **Embeddings Automáticos**: Generación de vectores con Google Gemini
- **Almacenamiento Vectorial**: Base de datos PostgreSQL con extensión pgvector
- **Índices de Texto Completo**: Optimización para búsquedas BM25
- **Búsqueda Rápida**: Índices optimizados para consultas híbridas

## 🔍 Búsqueda Híbrida

### Método Vectorial (Semántica)
- **Funcionamiento**: Convierte consultas en embeddings y busca similitud semántica
- **Ventajas**: Excelente para consultas complejas y lenguaje natural
- **Casos de Uso**: Preguntas conceptuales, análisis de contexto legal
- **Ejemplo**: "¿Cuáles son los derechos de los trabajadores en caso de despido?"

### Método BM25 (Texto Completo)
- **Funcionamiento**: Búsqueda de términos específicos con ranking de relevancia
- **Ventajas**: Preciso para artículos específicos y términos técnicos
- **Casos de Uso**: Búsqueda de artículos específicos, términos legales exactos
- **Ejemplo**: "Artículo 123 constitucional", "sociedad conyugal"

### Respuesta Combinada
- **Integración**: Combina los mejores resultados de ambos métodos
- **Deduplicación**: Elimina resultados duplicados por chunk_id
- **Ordenamiento**: Prioriza por score de similitud vectorial
- **Contexto Enriquecido**: Incluye información de ambos métodos en la respuesta

### Artículos Referenciados
- **Extracción Automática**: Identifica automáticamente artículos mencionados
- **Ordenamiento Inteligente**: 
  1. Artículos con doble match (vectorial + BM25)
  2. Score descendente (mayor a menor relevancia)
  3. Orden por documento y número de artículo
- **Información Detallada**: Muestra método de búsqueda y score para cada artículo

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI
- **Radix UI** - Componentes accesibles
- **React Dropzone** - Carga de archivos

### Backend
- **Supabase** - Base de datos PostgreSQL + Auth
- **pgvector** - Extensión para embeddings vectoriales
- **Google Gemini AI** - Generación de embeddings y respuestas
- **Chonkie** - Chunking semántico de documentos
- **Next.js API Routes** - Endpoints REST
- **BM25** - Algoritmo de ranking para búsqueda de texto completo

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Turbopack** - Bundler rápido
- **Python 3.12** - Scripts de procesamiento
- **Vercel** - Despliegue y hosting

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- Python 3.8+
- Cuenta de Supabase
- API Key de Google Gemini

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/legal-rag-supabase.git
cd legal-rag-supabase
```

### 2. Instalar Dependencias
```bash
# Dependencias de Node.js
npm install

# Dependencias de Python
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

# Google Gemini
GOOGLE_GEMINI_API_KEY=tu_api_key_de_gemini

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase
```bash
# Instalar CLI de Supabase
npm install -g supabase

# Inicializar proyecto
supabase init

# Aplicar migraciones
supabase db push

# O usar el script incluido
./scripts/apply-migrations.sh
```

### 5. Ejecutar el Proyecto
```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Producción
npm start
```

El proyecto estará disponible en [http://localhost:3000](http://localhost:3000)

## 🎯 Uso

### 1. Autenticación
- Registra una cuenta nueva o inicia sesión
- Las conversaciones se asocian automáticamente a tu usuario

### 2. Carga de Documentos
- Ve a la página de "Upload"
- Arrastra archivos PDF, DOCX o TXT
- Los documentos se procesan automáticamente con chunking semántico
- Los embeddings se generan y almacenan en la base de datos
- Se crean índices de texto completo para búsqueda BM25

### 3. Chat Legal Inteligente
- Escribe consultas legales en lenguaje natural
- El sistema ejecuta búsquedas vectorial y BM25 en paralelo
- Recibe tres tipos de respuestas:
  - **Respuesta Principal**: Basada en búsqueda vectorial
  - **Comparación de Métodos**: Resultados de ambos métodos lado a lado
  - **Respuesta Combinada**: Integración de ambos métodos
  - **Artículos Referenciados**: Resumen ordenado de artículos relevantes

### 4. Interpretación de Resultados

#### Comparación de Métodos
- **Búsqueda Vectorial (Azul)**: Resultados semánticos con scores de similitud
- **Búsqueda BM25 (Verde)**: Resultados de texto completo con scores de ranking
- **Respuesta Combinada (Púrpura)**: Integración de ambos métodos
- **Artículos Referenciados (Naranja)**: Resumen ordenado por relevancia

#### Artículos Referenciados
- **Doble Match**: Artículos encontrados por ambos métodos (más relevantes)
- **Score**: Puntuación de relevancia (mayor = más relevante)
- **Documento**: Fuente legal de origen
- **Métodos**: Vectorial, BM25, o ambos

### 5. Ejemplos de Consultas
```
"¿Cuáles son mis derechos según el artículo 19 de la Constitución?"
"¿Qué dice la ley sobre la libertad de expresión?"
"¿Cuáles son los requisitos para el debido proceso?"
"sociedad conyugal"
"disolución matrimonio"
```

## 🏗️ Arquitectura

### Estructura del Proyecto
```
legal-rag-supabase/
├── app/                    # Next.js App Router
│   ├── api/               # Endpoints API
│   │   ├── chat/          # Chat con búsqueda híbrida
│   │   ├── upload/        # Carga de documentos
│   │   └── documents/     # Gestión de documentos
│   ├── auth/              # Páginas de autenticación
│   ├── documents/         # Gestión de documentos
│   └── upload/            # Carga de archivos
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── ChatWindow.tsx    # Interfaz de chat con comparación
│   └── SearchResults.tsx # Visualización de resultados
├── lib/                  # Utilidades y configuraciones
│   ├── supabase/         # Cliente Supabase
│   ├── gemini.ts         # Configuración Gemini
│   └── db/              # Configuración de base de datos
├── scripts/              # Scripts Python
│   └── chonkie_chunker.py # Chunking semántico
├── supabase/             # Configuración Supabase
│   └── migrations/       # Migraciones SQL
└── types/                # Definiciones TypeScript
```

### Flujo de Datos Híbrido
1. **Carga de Documentos**: PDF/DOCX → Chunking → Embeddings + Índices BM25 → Base de datos
2. **Consulta**: Texto → Embedding + Búsqueda BM25 → Resultados paralelos
3. **Procesamiento**: Combinación + Deduplicación → Contexto enriquecido
4. **Respuesta**: Contexto + Prompt → Gemini AI → Respuesta legal fundamentada
5. **Análisis**: Extracción de artículos → Ordenamiento → Resumen referenciado

### Base de Datos
- **documents**: Metadatos de documentos cargados
- **chunks**: Fragmentos semánticos de documentos
- **embeddings**: Vectores de embeddings para búsqueda vectorial
- **chat_history**: Historial de conversaciones
- **Índices de texto completo**: Para búsqueda BM25

### Funciones SQL Clave
- **match_documents()**: Búsqueda vectorial con similitud
- **search_documents_bm25()**: Búsqueda de texto completo con ranking
- **extract_articles()**: Extracción de artículos referenciados

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente en cada push

### Variables de Entorno para Producción
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
GOOGLE_GEMINI_API_KEY=tu_api_key_de_gemini
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### Scripts de Despliegue
```bash
# Aplicar migraciones
./scripts/apply-migrations.sh

# Limpiar base de datos (desarrollo)
./scripts/clean-database.sh

# Verificar configuración
./scripts/verify-setup.sh
```

## 🔧 Configuración Avanzada

### Ajustar Sensibilidad de Búsqueda
En `supabase/migrations/`, modifica las funciones de búsqueda:
```sql
-- Ajustar threshold para búsqueda vectorial
WHERE similarity > 0.01  -- Valor por defecto

-- Ajustar parámetros BM25
SELECT *, ts_rank(to_tsvector('spanish', content), plainto_tsquery('spanish', $1)) as rank
```

### Personalizar Chunking
En `scripts/chonkie_chunker.py`:
```python
# Ajustar tamaño de chunks
chunker = SentenceChunker(
    chunk_size=256,  # Tokens por chunk
    chunk_overlap=50  # Overlap entre chunks
)
```

### Configurar Modelo de IA
En `lib/gemini.ts`:
```typescript
// Cambiar modelo de Gemini
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
```

### Ajustar Ordenamiento de Artículos
En `app/api/chat/route.ts`:
```typescript
// Modificar criterios de ordenamiento
const sortedDocs = uniqueDocs.sort((a, b) => {
  // Personalizar lógica de ordenamiento
});
```

## 🐛 Solución de Problemas

### Errores Comunes

**Error de conexión a Supabase**
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Error de embeddings**
```bash
# Verificar API key de Gemini
curl -H "Authorization: Bearer $GOOGLE_GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

**Búsqueda BM25 no funciona**
```bash
# Verificar índices de texto completo
psql -h tu-host -U tu-usuario -d tu-db -c "SELECT * FROM pg_indexes WHERE indexname LIKE '%bm25%';"
```

**Chunking no funciona**
```bash
# Verificar instalación de Python
python --version
pip list | grep chonkie
```

### Logs y Debugging
- Usa el endpoint `/api/debug` para verificar configuración
- Revisa logs en Supabase Dashboard
- Usa `console.log` en el frontend para debugging
- Verifica índices de texto completo en PostgreSQL

### Endpoints de Diagnóstico
- `/api/debug`: Verificar configuración general
- `/api/debug-embeddings`: Probar generación de embeddings
- `/api/test-supabase`: Verificar conexión a Supabase
- `/api/search-bm25`: Probar búsqueda BM25 independiente

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) por la infraestructura de base de datos
- [Google Gemini](https://ai.google.dev/) por la IA generativa
- [Chonkie](https://docs.chonkie.ai/) por el chunking semántico
- [Next.js](https://nextjs.org/) por el framework web
- [shadcn/ui](https://ui.shadcn.com/) por los componentes de UI
- [pgvector](https://github.com/pgvector/pgvector) por el soporte vectorial
- [PostgreSQL](https://www.postgresql.org/) por la base de datos robusta

---

<div align="center">
  <p>¿Tienes preguntas? Abre un <a href="https://github.com/tu-usuario/legal-rag-supabase/issues">issue</a> o contacta al equipo.</p>
  <p>⭐ ¡Dale una estrella si te gustó el proyecto!</p>
</div>
