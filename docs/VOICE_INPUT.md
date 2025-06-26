# Input por Voz - Funcionalidad Mejorada

## Descripción

La aplicación Legal RAG AI incluye funcionalidad de input por voz mejorada que permite a los usuarios dictar sus consultas legales de manera estable y duradera. Esta característica ha sido optimizada para resolver problemas de cortes automáticos y mejorar la experiencia de usuario.

## Características Mejoradas

### 🎤 **Reconocimiento de Voz Estable**
- **Modo continuo**: El reconocimiento se mantiene activo hasta que el usuario lo detenga
- **Reinicio automático**: Se reinicia automáticamente si se corta inesperadamente
- **Resultados intermedios**: Muestra el texto mientras hablas
- **Timeout configurable**: Ajusta el tiempo de silencio antes de enviar

### 🎨 **Interfaz Intuitiva**
- Botón de micrófono con estados visuales mejorados
- Indicador de grabación en tiempo real
- Animaciones y feedback visual
- Botón de parada (cuadrado) cuando está grabando

### 🛡️ **Manejo de Errores Robusto**
- Detección y manejo específico de errores
- Reintentos automáticos en caso de fallos
- Mensajes de error informativos
- Fallback graceful para navegadores antiguos

### ⚙️ **Configuración Avanzada**
- Timeout de silencio ajustable (1-10 segundos)
- Número de alternativas de reconocimiento (1-5)
- Modo continuo configurable
- Configuración persistente

## Cómo Usar

### 1. **Activar el Micrófono**
- Haz clic en el botón del micrófono (🎤) junto al campo de texto
- El botón cambiará a rojo con un ícono de cuadrado (⏹️)
- Aparecerá un indicador "Grabando..." en la esquina superior derecha

### 2. **Dictar tu Consulta**
- Habla claramente tu consulta legal
- El sistema transcribirá automáticamente tu voz
- Verás el texto aparecer en tiempo real
- La grabación continuará hasta que hagas clic en el botón de parada

### 3. **Detener la Grabación**
- Haz clic en el botón de parada (⏹️) para detener la grabación
- El texto transcrito aparecerá en el campo de entrada
- Puedes editar el texto si es necesario
- Haz clic en "Enviar" para procesar tu consulta

## Configuración de Voz

### ⚙️ **Parámetros Ajustables**

1. **Timeout de Silencio**
   - Rango: 1-10 segundos
   - Por defecto: 3 segundos
   - Controla cuánto tiempo esperar en silencio antes de enviar

2. **Alternativas de Reconocimiento**
   - Rango: 1-5 alternativas
   - Por defecto: 3 alternativas
   - Mejora la precisión del reconocimiento

3. **Modo Continuo**
   - Activado por defecto
   - Mantiene el reconocimiento activo continuamente
   - Ideal para consultas largas

## Mejoras Técnicas Implementadas

### 🔧 **Configuración Optimizada**
```typescript
recognition.continuous = true;        // Modo continuo
recognition.interimResults = true;    // Resultados intermedios
recognition.maxAlternatives = 3;      // Múltiples alternativas
recognition.lang = 'es-MX';          // Español mexicano
```

### 🔄 **Reinicio Automático**
- Detección automática de cortes
- Reinicio inmediato sin interrumpir al usuario
- Manejo de errores con reintentos

### ⏱️ **Gestión de Timeouts**
- Timeout de silencio configurable
- Envío automático de texto intermedio
- Limpieza automática de recursos

## Solución de Problemas

### ❌ **Problema: La grabación se corta después de pocos segundos**

**Causas comunes:**
1. Configuración `continuous = false`
2. Timeout de silencio muy corto
3. Errores de red o permisos
4. Navegador no compatible

**Soluciones implementadas:**
- ✅ Modo continuo activado por defecto
- ✅ Timeout de silencio configurable (3 segundos por defecto)
- ✅ Reinicio automático en caso de errores
- ✅ Manejo robusto de errores de red

### 🔧 **Configuración Recomendada**

Para consultas largas:
```typescript
{
  silenceTimeout: 5,      // 5 segundos de silencio
  maxAlternatives: 3,     // 3 alternativas
  continuous: true        // Modo continuo
}
```

Para consultas rápidas:
```typescript
{
  silenceTimeout: 2,      // 2 segundos de silencio
  maxAlternatives: 1,     // 1 alternativa
  continuous: true        // Modo continuo
}
```

## Compatibilidad

### ✅ **Navegadores Soportados**
- Google Chrome (recomendado)
- Microsoft Edge
- Safari (macOS)
- Firefox (limitado)

### ❌ **Navegadores No Soportados**
- Internet Explorer
- Navegadores móviles antiguos
- Navegadores sin soporte para Web Speech API

## Mensajes de Error Mejorados

| Error | Descripción | Solución |
|-------|-------------|----------|
| `no-speech` | No se detectó voz | Normal, no requiere acción |
| `audio-capture` | Error al capturar audio | Verifica tu micrófono |
| `not-allowed` | Permiso denegado | Permite acceso al micrófono |
| `network` | Error de red | Verifica tu conexión |
| `aborted` | Reconocimiento abortado | Se reinicia automáticamente |

## Componentes Técnicos

### `VoiceInputV2`
Componente principal mejorado con:
- Manejo robusto de errores
- Reinicio automático
- Configuración avanzada
- Logging detallado

### `VoiceIndicator`
Indicador visual mejorado que muestra:
- Estado de grabación
- Animaciones suaves
- Posicionamiento fijo

### `VoiceSettings`
Panel de configuración con:
- Sliders interactivos
- Configuración persistente
- Interfaz intuitiva

### `VoiceHelp`
Modal de ayuda con:
- Instrucciones detalladas
- Consejos de uso
- Información de compatibilidad

## Logging y Debugging

El componente incluye logging detallado para debugging:

```javascript
🎤 Reconocimiento iniciado
🎵 Audio iniciado
🔊 Sonido detectado
🗣️ Habla iniciada
🤐 Habla terminada
🛑 Reconocimiento terminado
🔄 Reiniciando reconocimiento automáticamente...
```

## Futuras Mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Corrección automática de texto
- [ ] Comandos de voz personalizados
- [ ] Integración con síntesis de voz
- [ ] Modo de dictado por párrafos
- [ ] Exportación de transcripciones 