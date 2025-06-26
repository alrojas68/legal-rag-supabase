# Endpoint de Chat - Documentación API

## Descripción
El endpoint de chat implementa un sistema RAG (Retrieval-Augmented Generation) que combina búsqueda vectorial en Supabase con generación de respuestas usando Google Gemini. **Versión MVP sin autenticación de usuarios.**

## Endpoints Disponibles

### 1. POST /api/chat
Envía una consulta y recibe una respuesta basada en documentos legales.

#### Request Body
```json
{
  "query": "¿Cuáles son los requisitos para obtener la nacionalidad mexicana?",
  "messages": [
    {
      "role": "user",
      "content": "Hola, necesito información sobre nacionalidad"
    },
    {
      "role": "assistant", 
      "content": "Te ayudo con información sobre nacionalidad mexicana..."
    }
  ]
}
```

#### Headers Opcionales
- `x-session-id`: ID de sesión para agrupar conversaciones (default: 'default-session')

#### Response
```json
{
  "success": true,
  "response": "Según la Constitución Mexicana, los requisitos para obtener la nacionalidad mexicana son...",
  "documents": [
    {
      "document_id": "uuid",
      "source": "Constitución Política de los Estados Unidos Mexicanos",
      "similarity_score": 0.95,
      "content": "Artículo 30. La nacionalidad mexicana..."
    }
  ],
  "query": "¿Cuáles son los requisitos para obtener la nacionalidad mexicana?",
  "timestamp": "2024-03-20T10:30:00.000Z"
}
```

### 2. GET /api/chat/history
Obtiene el historial de conversaciones por sesión.

#### Query Parameters
- `limit` (opcional): Número máximo de registros (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)
- `session_id` (opcional): ID de sesión (default: 'default-session')

#### Response
```json
{
  "success": true,
  "chatHistory": [
    {
      "chat_id": "uuid",
      "query": "¿Cuáles son los requisitos para obtener la nacionalidad mexicana?",
      "response": "Según la Constitución Mexicana...",
      "documents_used": ["uuid1", "uuid2"],
      "session_id": "default-session",
      "created_at": "2024-03-20T10:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "sessionId": "default-session"
}
```

### 3. DELETE /api/chat/history
Elimina registros del historial de chat.

#### Query Parameters
- `chat_id` (opcional): ID específico del chat a eliminar
- `session_id` (opcional): Eliminar todos los chats de una sesión específica (default: 'default-session')

**Nota**: Se requiere al menos uno de los dos parámetros.

#### Response
```json
{
  "success": true,
  "message": "Historial de chat eliminado correctamente"
}
```

## Características del Sistema

### Búsqueda Vectorial
- Utiliza embeddings de Gemini (768 dimensiones)
- Búsqueda por similitud coseno en Supabase
- Retorna los 5 documentos más relevantes por defecto

### Generación de Respuestas
- Modelo: Gemini 1.5 Flash
- Prompt especializado en derecho mexicano
- Contexto basado en documentos encontrados
- Historial de conversación incluido

### Gestión de Sesiones
- Sesiones identificadas por `session_id`
- Sesión por defecto: 'default-session'
- Historial agrupado por sesión
- Sin autenticación de usuarios (MVP)

## Variables de Entorno Requeridas

```env
GOOGLE_API_KEY=tu_api_key_de_google
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
```

## Ejemplo de Uso con JavaScript

```javascript
// Enviar consulta
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': 'mi-sesion-123' // Opcional
  },
  body: JSON.stringify({
    query: '¿Cuáles son los requisitos para obtener la nacionalidad mexicana?',
    messages: []
  })
});

const data = await response.json();
console.log(data.response);

// Obtener historial de una sesión específica
const historyResponse = await fetch('/api/chat/history?session_id=mi-sesion-123&limit=10');
const historyData = await historyResponse.json();
console.log(historyData.chatHistory);

// Eliminar historial de una sesión
const deleteResponse = await fetch('/api/chat/history?session_id=mi-sesion-123', {
  method: 'DELETE'
});
```

## Manejo de Errores

El endpoint retorna errores en el siguiente formato:

```json
{
  "error": "Descripción del error",
  "details": "Detalles adicionales del error",
  "success": false
}
```

### Códigos de Estado HTTP
- `200`: Operación exitosa
- `400`: Error en los datos de entrada
- `500`: Error interno del servidor

## Notas de Implementación

1. **Embeddings**: Se generan usando el modelo `embedding-001` de Gemini
2. **Búsqueda**: Utiliza la función `match_documents` de Supabase
3. **Respuestas**: Generadas con `gemini-1.5-flash`
4. **Historial**: Se guarda automáticamente en la tabla `chat_history`
5. **Sesiones**: Soporte para múltiples sesiones sin autenticación
6. **MVP**: Sin autenticación de usuarios, ideal para prototipos 