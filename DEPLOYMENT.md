# 🚀 Guía de Deployment en Vercel

## 📋 Requisitos Previos

1. **Cuenta en Vercel**: [vercel.com](https://vercel.com)
2. **Repositorio en GitHub/GitLab**: Tu código debe estar en un repositorio
3. **Proyecto Supabase configurado**: Con las migraciones aplicadas
4. **API Key de Google Gemini**: Para el procesamiento de IA

## 🔧 Configuración del Proyecto

### 1. Variables de Entorno Requeridas

Configura estas variables en el dashboard de Vercel:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=tu_api_key_de_gemini

# Application Configuration
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 2. Obtener Credenciales de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings > API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API Key
3. Copia la key → `GOOGLE_GEMINI_API_KEY`

## 🚀 Pasos de Deployment

### Opción 1: Deployment Automático (Recomendado)

1. **Conectar Repositorio**:
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Conecta tu repositorio de GitHub/GitLab
   - Selecciona el repositorio `legal-rag-supabase`

2. **Configurar Variables de Entorno**:
   - En la configuración del proyecto, ve a **Settings > Environment Variables**
   - Agrega todas las variables listadas arriba
   - Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**

3. **Configurar Dominio**:
   - Ve a **Settings > Domains**
   - Agrega tu dominio personalizado si lo tienes
   - O usa el dominio `.vercel.app` que te proporcionan

4. **Deployment Automático**:
   - Cada push a `main` o `master` desplegará automáticamente
   - Los deployments de otras ramas crearán previews

### Opción 2: Deployment Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login a Vercel
vercel login

# Deploy desde el directorio del proyecto
vercel

# Para producción
vercel --prod
```

## 🔍 Verificación Post-Deployment

### 1. Verificar Variables de Entorno

```bash
# Ejecutar el script de verificación
./scripts/verify-deployment.sh
```

### 2. Verificar Funcionalidades

1. **Autenticación**: Registra una cuenta nueva
2. **Carga de Documentos**: Sube un PDF de prueba
3. **Chat**: Haz una pregunta legal
4. **Búsqueda**: Verifica que funcione la búsqueda híbrida

### 3. Verificar Logs

- Ve a tu proyecto en Vercel
- **Functions** → Revisa los logs de las API routes
- **Analytics** → Monitorea el rendimiento

## 🛠️ Solución de Problemas

### Error: "Build Failed"

**Causa común**: Variables de entorno faltantes
```bash
# Verificar que todas las variables estén configuradas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $GOOGLE_GEMINI_API_KEY
```

### Error: "Database Connection Failed"

**Solución**:
1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
2. Asegúrate de que las migraciones estén aplicadas en Supabase
3. Verifica que la URL de Supabase sea correcta

### Error: "Gemini API Error"

**Solución**:
1. Verifica que `GOOGLE_GEMINI_API_KEY` sea válida
2. Revisa los límites de cuota en Google AI Studio
3. Verifica que la key tenga permisos para Gemini

### Error: "Function Timeout"

**Solución**:
- Las funciones tienen un límite de 30 segundos en Vercel
- Para archivos grandes, considera procesamiento asíncrono
- Optimiza las consultas a la base de datos

## 📊 Monitoreo y Mantenimiento

### 1. Logs y Analytics

- **Vercel Analytics**: Monitorea el rendimiento
- **Function Logs**: Revisa errores en tiempo real
- **Supabase Dashboard**: Monitorea la base de datos

### 2. Actualizaciones

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Deploy automático al hacer push
git push origin main
```

### 3. Backup y Recuperación

- **Supabase**: Los datos se respaldan automáticamente
- **Código**: Usa Git para versionado
- **Variables de Entorno**: Documenta todas las configuraciones

## 🔒 Seguridad

### 1. Variables de Entorno

- ✅ **Nunca** commits variables sensibles
- ✅ Usa `NEXT_PUBLIC_` solo para variables del cliente
- ✅ Mantén las service keys seguras

### 2. Permisos de Supabase

- ✅ Usa RLS (Row Level Security) en todas las tablas
- ✅ Limita los permisos de la service role
- ✅ Revisa regularmente los permisos

### 3. Rate Limiting

- ✅ Considera implementar rate limiting en las API routes
- ✅ Monitorea el uso de la API de Gemini
- ✅ Configura alertas para uso excesivo

## 📞 Soporte

### Recursos Útiles

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Google AI Studio](https://makersuite.google.com)

### Comandos de Debug

```bash
# Verificar configuración local
npm run build

# Verificar variables de entorno
./scripts/verify-deployment.sh

# Ver logs de Vercel
vercel logs

# Verificar estado de Supabase
supabase status
```

---

**¡Tu aplicación legal RAG está lista para producción! 🎉** 