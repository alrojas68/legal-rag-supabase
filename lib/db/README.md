# Drizzle ORM Integration - MIGRACIÓN COMPLETADA ✅

Esta carpeta contiene la configuración y esquemas de Drizzle ORM para la aplicación Legal RAG.

## 🎯 Estado de la Migración

**✅ MIGRACIÓN COMPLETADA** - Todos los endpoints principales han sido migrados a Drizzle ORM.

### Endpoints Migrados:
- ✅ `/api/documents` - Listado de documentos con estadísticas
- ✅ `/api/chat/history` - Historial de chat (GET/DELETE)
- ✅ `/api/search-bm25` - Búsqueda BM25 mejorada
- ✅ `/api/test-bm25-improvements` - Pruebas de mejoras BM25
- ✅ `/api/test-drizzle` - Pruebas de Drizzle
- ✅ `/api/test-drizzle-migration` - Pruebas de migración completa

## Estructura

```
lib/db/
├── schema.ts      # Esquemas de tablas y relaciones
├── index.ts       # Cliente de Drizzle
├── queries.ts     # Funciones de consulta (BM25, híbrida, etc.)
└── README.md      # Esta documentación
```

## Configuración

### Variables de Entorno

```bash
# URL de conexión a Supabase/PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
# O usar la URL de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Scripts Disponibles

```bash
# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Sincronizar esquema (desarrollo)
npm run db:push

# Abrir Drizzle Studio
npm run db:studio
```

## Funcionalidades Implementadas

### 1. Búsqueda BM25 Mejorada

```typescript
import { searchWithBM25Improved } from '@/lib/db/queries';

const results = await searchWithBM25Improved('condominio', 30, 1.2, 0.75);
```

### 2. Búsqueda BM25 con Resaltado

```typescript
import { searchWithBM25Highlighted } from '@/lib/db/queries';

const results = await searchWithBM25Highlighted('condominio', 30);
```

### 3. Búsqueda BM25 con Sinónimos

```typescript
import { searchWithBM25Synonyms } from '@/lib/db/queries';

const results = await searchWithBM25Synonyms('condominio', 30);
```

### 4. Búsqueda Vectorial

```typescript
import { searchWithEmbeddings } from '@/lib/db/queries';

const results = await searchWithEmbeddings(queryEmbedding, 10);
```

### 5. Búsqueda Híbrida Completa

```typescript
import { searchHybridComplete } from '@/lib/db/queries';

const results = await searchHybridComplete(query, queryEmbedding, 30, 10);
```

### 6. Gestión de Documentos

```typescript
import { getAllDocumentsWithStats } from '@/lib/db/queries';

const documents = await getAllDocumentsWithStats();
```

### 7. Chat History

```typescript
import { getChatHistory, saveChatHistory, deleteChatHistory } from '@/lib/db/queries';

// Obtener historial
const history = await getChatHistory('session-id', 50);

// Guardar conversación
await saveChatHistory(query, response, documentsUsed, 'session-id');

// Eliminar historial
await deleteChatHistory(undefined, 'session-id');
```

### 8. Estadísticas de Base de Datos

```typescript
import { getCompleteDatabaseStats } from '@/lib/db/queries';

const stats = await getCompleteDatabaseStats();
```

## Esquemas de Tablas

### Documents
- `documentId`: UUID (PK)
- `source`: Texto del archivo
- `publicationDate`: Fecha de publicación
- `jurisdiction`: Jurisdicción (Federal, Estatal, etc.)

### Chunks
- `chunkId`: UUID (PK)
- `chunkText`: Texto del fragmento
- `charCount`: Número de caracteres
- `legalDocumentName`: Nombre del documento legal
- `articleNumber`: Número de artículo

### Embeddings
- `vectorId`: UUID (PK)
- `chunkId`: Referencia al chunk
- `embedding`: Vector de embeddings (768 dimensiones)

### Legal Hierarchy
- `hierarchyId`: UUID (PK)
- `hierarchyLevel`: Nivel en la jerarquía legal
- `legalDocumentName`: Nombre del documento
- `jurisdiction`: Jurisdicción

## Ventajas de Drizzle

✅ **Type Safety**: Tipado completo de esquemas y queries  
✅ **Performance**: Queries optimizadas automáticamente  
✅ **Developer Experience**: Mejor autocompletado  
✅ **BM25 Integration**: Búsqueda de texto completo nativa  
✅ **Hybrid Search**: Combinación BM25 + Embeddings  
✅ **Migración Completa**: Todos los endpoints principales migrados  

## Testing

```bash
# Probar migración completa
curl http://localhost:3000/api/test-drizzle-migration

# Probar Drizzle básico
curl http://localhost:3000/api/test-drizzle

# Probar búsqueda BM25
curl "http://localhost:3000/api/search-bm25?q=condominio&method=improved"

# Probar mejoras BM25
curl -X POST http://localhost:3000/api/test-bm25-improvements \
  -H "Content-Type: application/json" \
  -d '{"query": "derechos civiles"}'
```

## Próximos Pasos

1. ✅ Configurar Drizzle
2. ✅ Implementar BM25 mejorado
3. ✅ Migrar endpoints principales
4. ✅ Implementar búsqueda híbrida
5. 🔄 Optimizar queries para mejor performance
6. 🔄 Implementar cache para queries frecuentes
7. 🔄 Migrar endpoint de chat principal
8. 🔄 Migrar endpoints de upload

## Comparación de Performance

### Antes (Supabase Client):
- Queries directas a Supabase
- Sin tipado fuerte
- Dependencia de funciones RPC externas

### Después (Drizzle ORM):
- Queries optimizadas con tipado fuerte
- Mejor control sobre las consultas
- Funciones nativas de PostgreSQL
- Mejor developer experience

## Troubleshooting

### Error de conexión:
```bash
# Verificar variables de entorno
echo $DATABASE_URL
echo $NEXT_PUBLIC_SUPABASE_URL

# Probar conexión
npm run db:studio
```

### Error de migración:
```bash
# Regenerar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:migrate
```

### Error de queries:
```bash
# Verificar esquemas
cat lib/db/schema.ts

# Probar queries individuales
curl http://localhost:3000/api/test-drizzle-migration
``` 