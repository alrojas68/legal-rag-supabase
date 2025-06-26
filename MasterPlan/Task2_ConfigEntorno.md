# Task 2: Configuración del Entorno

## 🎯 Objetivo
Configurar el entorno de desarrollo para LegalRAG, asegurando que todas las herramientas, dependencias y variables necesarias estén listas para el desarrollo y despliegue de la aplicación.

## 📝 Tareas

1. **Inicializar el proyecto Next.js + TailwindCSS**
   - [ ] Crear el proyecto base con Next.js
   - [ ] Instalar y configurar TailwindCSS
   - [ ] Verificar funcionamiento de estilos

2. **Configurar repositorio Git y control de versiones**
   - [ ] Inicializar repositorio Git (si no existe)
   - [ ] Crear archivo `.gitignore` adecuado
   - [ ] Subir el proyecto a GitHub o plataforma elegida

3. **Configurar variables de entorno**
   - [ ] Crear archivo `.env.local` con las siguientes variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - (Opcional) Claves de Vertex AI para embeddings
   - [ ] Añadir `.env.local` a `.gitignore`

4. **Instalar dependencias principales**
   - [ ] Instalar `@supabase/supabase-js` y `@supabase/ssr`
   - [ ] Instalar `@ai-sdk/react` (o SDK de agente)
   - [ ] Instalar librerías de UI: Tailwind, Radix, etc.
   - [ ] Verificar que todas las dependencias se instalan correctamente

5. **Configurar scripts de desarrollo**
   - [ ] Añadir scripts útiles en `package.json` (`dev`, `build`, `start`, `lint`)
   - [ ] Probar que los scripts funcionan correctamente

6. **Verificar la estructura del proyecto**
   - [ ] Revisar que la estructura de carpetas y archivos sea clara y modular
   - [ ] Documentar cualquier convención relevante en el README

---

> **Nota:** Marca cada tarea como completada `[x]` conforme avances. Puedes agregar sub-tareas o comentarios según necesidades específicas del proyecto. 