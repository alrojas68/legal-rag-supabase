# Master Plan: LegalRAG — Asistente Legal Inteligente

## 1. Planeación y Diseño

- **Definir el alcance funcional**  
  - Chat legal con RAG híbrido (SQL + embeddings)
  - Historial de conversaciones por usuario
  - Consulta legal con razonamiento y citas
  - Seguridad básica (Supabase Auth)
- **Diseño de la UI**  
  - Wireframe de la interfaz conversacional (sidebar, chat, input)
  - Identidad visual (logo, colores, fuentes)

---

## 2. Configuración del Entorno

- Inicializar proyecto Next.js + TailwindCSS
- Configurar repositorio Git y control de versiones
- Configurar variables de entorno  
  - Claves de Supabase (URL y Anon Key)
  - Claves de Vertex AI (para embeddings, si aplica)
- Instalar dependencias principales  
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `@ai-sdk/react` (o SDK de agente)
  - UI: Tailwind, Radix, etc.

---

## 3. Backend: Supabase y Base de Datos

- Diseñar y crear el esquema SQL  
  - Tablas: `documents`, `sections`, `chunks`, `embeddings`
  - Relaciones y llaves foráneas
  - Extensión pgvector y tabla de embeddings
- Cargar datos de ejemplo  
  - Insertar documentos legales de prueba
  - Insertar embeddings de ejemplo

---

## 4. Backend: API y Lógica de Agente

- Crear endpoints API REST  
  - `/api/chat`: recibe mensajes y responde usando el agente
  - (Opcional) `/api/conversations`: para historial
- Integrar Supabase en el backend  
  - Consultas SQL estructuradas (filtrado por jurisdicción, tipo, etc.)
  - Consultas semánticas (búsqueda por embeddings)
- Implementar lógica del agente  
  - Orquestación de herramientas: `sql_query` y `rag_query`
  - Generación de respuestas con razonamiento legal y citas
  - (Opcional) Integrar Google ADK para modularidad avanzada

---

## 5. Frontend: Interfaz de Usuario

- Estructura de componentes  
  - `Sidebar`: historial de conversaciones
  - `ChatWindow`: ventana de chat, logo, input y botón enviar
- Integrar frontend con backend  
  - Enviar mensajes al endpoint `/api/chat`
  - Mostrar respuestas y referencias legales
  - Manejar estados de carga y errores
- Autenticación de usuario  
  - Registro, login y logout con Supabase Auth
  - Asociar conversaciones al usuario autenticado

---

## 6. Funcionalidades Extra (Fase 2+)

- Resumen automático de conversación
- Citas legales como tooltips o referencias
- Etiquetado por tipo de pregunta (penal, civil, etc.)
- Feedback de usuario por respuesta
- Panel de administración de documentos

---

## 7. Pruebas y Validación

- Pruebas de integración y funcionalidad
- Validar precisión de recuperación semántica
- Pruebas de usuario (UX/UI)

---

## 8. Despliegue y Documentación

- Configurar despliegue (Vercel, Railway, Cloudflare)
- Documentar el uso y la arquitectura en README
- Manual de usuario básico

---

## 9. Mantenimiento y Escalabilidad

- Monitoreo de logs y errores
- Actualización de corpus legal
- Mejoras continuas en UX y lógica del agente

---

### Resumen Visual del Flujo

1. Usuario inicia sesión
2. Escribe consulta legal en el chat
3. El frontend envía la consulta al backend
4. El backend filtra documentos vía SQL en Supabase
5. El backend realiza búsqueda semántica (RAG) en los documentos filtrados
6. El agente genera una respuesta legal fundamentada
7. El frontend muestra la respuesta y la guarda en el historial


Here’s a summary of your project’s debugging and improvement journey:
Voice Recognition: Fixed "aborted" errors by improving error handling and restart logic.
Chat Input: Resolved Enter key activating the microphone by adding a dedicated handler for sending messages.
Document Uploads: Improved speed by parallelizing embedding generation and batching DB inserts; handled Gemini API 429 errors with exponential backoff and retries.
Vector Search Issues:
The match_documents SQL function returned zero results due to conflicting versions and incorrect embedding handling. You fixed this by ensuring it accepts embeddings as a parameter and removed duplicates.
Despite direct DB queries showing relevant data, the search function returned no results. You improved it by manually calculating cosine similarity, lowering the threshold (from 0.1 to 0.01), and handling JSON string embeddings correctly.
Prompt Engineering: Refined prompts to focus on the Mexican Constitution, require citations, and handle no-context cases.
Persistent Retrieval Problem: Even with improvements, queries for "artículo 19" failed to retrieve the correct chunk, despite its presence in the DB. You confirmed this via a test endpoint and enhanced the hybrid search to prioritize exact "artículo N" matches.
Reverting Search Logic: At your suggestion, the assistant reverted to a simpler, vector-only search with a threshold of 0.01, but the issue persisted.
Reference Implementation: You provided an OpenAI-based reference with a threshold of -0.3. The assistant updated the threshold, but the chunk still wasn’t found.
Direct RPC Testing: Testing the match_documents RPC directly confirmed it returned results, but not the desired chunk.
Key Focus: The main challenge remains ensuring that specific legal articles (like "artículo 19") are reliably retrieved and included in the answer context, despite the presence of their embeddings in the database. The debugging has centered on embedding alignment, similarity thresholds, and hybrid search logic to improve retrieval accuracy for legal queries.