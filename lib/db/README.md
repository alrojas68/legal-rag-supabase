# Drizzle ORM Integration

Esta carpeta contiene la configuración y esquemas de Drizzle ORM para la aplicación Legal RAG.

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

## Funcionalidades

### 1. Búsqueda BM25

```typescript
import { searchWithBM25 } from '@/lib/db/queries';

const results = await searchWithBM25('condominio', 30);
```

### 2. Búsqueda Híbrida (BM25 + Embeddings)

```typescript
import { searchHybrid } from '@/lib/db/queries';

const results = await searchHybrid(query, queryEmbedding, 30, 10);
```

### 3. Búsqueda Exacta de Artículos

```typescript
import { searchExactArticle } from '@/lib/db/queries';

const article = await searchExactArticle('19');
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

## Migración desde Supabase Client

La migración es gradual:

1. **Fase 1**: Drizzle junto a Supabase (actual)
2. **Fase 2**: Migrar endpoints críticos
3. **Fase 3**: Migrar upload y procesamiento
4. **Fase 4**: Eliminar Supabase client directo

## Testing

```bash
# Probar Drizzle
curl http://localhost:3000/api/test-drizzle
```

## Próximos Pasos

1. ✅ Configurar Drizzle
2. ✅ Implementar BM25
3. 🔄 Migrar endpoint de chat
4. 🔄 Migrar endpoint de upload
5. 🔄 Optimizar queries
6. 🔄 Implementar cache 