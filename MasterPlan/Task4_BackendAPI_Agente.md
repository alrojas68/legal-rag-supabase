# Task 4: Backend — API y Lógica de Agente

## 🎯 Objetivo
Desarrollar la API REST y la lógica del agente que orquesta las consultas híbridas (SQL y RAG), integrando Supabase y el agente ADK para responder consultas legales de forma precisa y fundamentada.

## 📝 Tareas

1. **Crear endpoints API REST**
   - [ ] Implementar `/api/chat` para recibir mensajes y responder usando el agente
   - [ ] (Opcional) Implementar `/api/conversations` para historial de usuario

2. **Integrar Supabase en el backend**
   - [ ] Realizar consultas SQL estructuradas (filtrado por jurisdicción, tipo, etc.)
   - [ ] Implementar consultas semánticas (búsqueda por embeddings)

3. **Implementar lógica del agente**
   - [ ] Orquestar herramientas: `sql_query` y `rag_query`
   - [ ] Generar respuestas con razonamiento legal y citas
   - [ ] (Opcional) Integrar Google ADK para modularidad avanzada

4. **Pruebas y validación del backend**
   - [ ] Probar los endpoints con datos reales
   - [ ] Validar la precisión y relevancia de las respuestas

---

> **Nota:** Marca cada tarea como completada `[x]` conforme avances. Puedes agregar sub-tareas o comentarios según necesidades específicas del proyecto. 