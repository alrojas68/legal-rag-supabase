import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { Button } from './button';
import { VoiceIndicator } from './voice-indicator';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputV2({ onTranscript, disabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);
  const shouldProcessResultsRef = useRef(false);
  const abortCountRef = useRef(0);
  const maxAbortRetries = 3;

  // Sincronizar el ref con el estado
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Limpiar timeouts
  const clearTimeouts = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  // Reiniciar reconocimiento con mejor manejo de errores
  const restartRecognition = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    
    try {
      // Detener el reconocimiento actual de forma segura
      if (recognitionRef.current.state === 'recording') {
        recognitionRef.current.stop();
      }
      
      restartTimeoutRef.current = setTimeout(() => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            console.log('🔄 Reconocimiento reiniciado exitosamente');
          } catch (err) {
            console.error('Error al reiniciar reconocimiento:', err);
            // Si falla el reinicio, detener completamente
            setIsListening(false);
            setError('Error al reiniciar el reconocimiento de voz');
          }
        }
      }, 300); // Aumentar el delay para dar más tiempo
    } catch (err) {
      console.error('Error al detener reconocimiento para reinicio:', err);
      // Si hay error al detener, intentar crear una nueva instancia
      if (isListeningRef.current) {
        setTimeout(() => {
          try {
            const newRecognition = setupRecognition();
            if (newRecognition) {
              recognitionRef.current = newRecognition;
              recognitionRef.current.start();
            }
          } catch (err) {
            console.error('Error al crear nueva instancia:', err);
            setIsListening(false);
          }
        }, 500);
      }
    }
  }, []);

  // Configurar reconocimiento de voz
  const setupRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Tu navegador no soporta reconocimiento de voz');
      return null;
    }

    const recognition = new SpeechRecognition();
    
    // Configuración optimizada para duración
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'es-MX';
    
    // Configurar eventos
    recognition.onstart = () => {
      console.log('🎤 Reconocimiento iniciado');
      // Resetear contador de abortos
      abortCountRef.current = 0;
      // Limpiar completamente el estado antes de empezar
      setCurrentTranscript('');
      setFinalTranscript('');
      setError(null);
      setIsListening(true);
      // Activar procesamiento de resultados después de un pequeño delay
      setTimeout(() => {
        shouldProcessResultsRef.current = true;
      }, 100);
    };

    recognition.onresult = (event: any) => {
      // Solo procesar resultados si el flag está activo
      if (!shouldProcessResultsRef.current) {
        console.log('⏭️ Ignorando resultados residuales de sesión anterior');
        return;
      }

      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          newFinalTranscript += transcript + ' ';
          // Enviar texto final inmediatamente
          if (newFinalTranscript.trim()) {
            onTranscript(newFinalTranscript.trim());
          }
        } else {
          interimTranscript += transcript;
        }
      }

      // Actualizar el estado solo con el texto de esta sesión
      setFinalTranscript(prev => prev + newFinalTranscript);
      setCurrentTranscript(interimTranscript);

      // Reiniciar timeout de silencio
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Si hay silencio por 3 segundos, enviar el texto intermedio
      silenceTimeoutRef.current = setTimeout(() => {
        if (interimTranscript.trim()) {
          onTranscript(interimTranscript.trim());
          setCurrentTranscript('');
        }
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Error en reconocimiento:', event.error);
      
      // Manejar errores específicos
      switch (event.error) {
        case 'no-speech':
          // No hacer nada, es normal
          break;
        case 'network':
          setError('Error de red. Verifica tu conexión.');
          setIsListening(false);
          break;
        case 'not-allowed':
          setError('Permiso denegado para usar el micrófono.');
          setIsListening(false);
          break;
        case 'audio-capture':
          setError('Error al capturar audio. Verifica tu micrófono.');
          setIsListening(false);
          break;
        case 'aborted':
          // Incrementar contador de abortos
          abortCountRef.current++;
          console.log(`🔄 Abortado ${abortCountRef.current}/${maxAbortRetries} veces`);
          
          // Si hemos tenido demasiados abortos, detener completamente
          if (abortCountRef.current >= maxAbortRetries) {
            console.log('🛑 Demasiados abortos, deteniendo reconocimiento');
            setIsListening(false);
            setError('Demasiados errores de reconocimiento. Intenta de nuevo.');
            return;
          }
          
          // Reconocimiento abortado, intentar reiniciar con delay progresivo
          if (isListeningRef.current) {
            const delay = Math.min(500 * abortCountRef.current, 2000);
            console.log(`🔄 Reintentando reconocimiento en ${delay}ms...`);
            setTimeout(() => restartRecognition(), delay);
          }
          break;
        default:
          // Para otros errores, intentar reiniciar
          if (isListeningRef.current) {
            console.log('🔄 Reintentando reconocimiento por error desconocido...');
            setTimeout(() => restartRecognition(), 1000);
          }
      }
    };

    recognition.onend = () => {
      console.log('🛑 Reconocimiento terminado');
      
      // Desactivar procesamiento de resultados
      shouldProcessResultsRef.current = false;
      
      // Si aún debería estar escuchando, reiniciar
      if (isListeningRef.current) {
        console.log('🔄 Reiniciando reconocimiento automáticamente...');
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Error al reiniciar:', err);
              setIsListening(false);
            }
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    // Eventos adicionales para debugging
    recognition.onaudiostart = () => console.log('🎵 Audio iniciado');
    recognition.onaudioend = () => console.log('🎵 Audio terminado');
    recognition.onsoundstart = () => console.log('🔊 Sonido detectado');
    recognition.onsoundend = () => console.log('🔇 Sonido terminado');
    recognition.onspeechstart = () => console.log('🗣️ Habla iniciada');
    recognition.onspeechend = () => console.log('🤐 Habla terminada');

    return recognition;
  }, [onTranscript, restartRecognition]);

  useEffect(() => {
    recognitionRef.current = setupRecognition();
    setIsSupported(!!recognitionRef.current);

    return () => {
      clearTimeouts();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error al limpiar reconocimiento:', err);
        }
      }
    };
  }, [setupRecognition, clearTimeouts]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    
    // Resetear contador de abortos
    abortCountRef.current = 0;
    
    // Desactivar procesamiento de resultados inmediatamente
    shouldProcessResultsRef.current = false;
    
    // Limpiar cualquier texto anterior antes de empezar
    setCurrentTranscript('');
    setFinalTranscript('');
    setError(null);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error al iniciar reconocimiento:', err);
      setError('Error al iniciar el reconocimiento de voz');
      setIsListening(false);
    }
  }, [disabled]);

  const stopListening = useCallback(() => {
    // Desactivar procesamiento de resultados
    shouldProcessResultsRef.current = false;
    
    setIsListening(false);
    clearTimeouts();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error al detener reconocimiento:', err);
      }
    }
    
    // Solo enviar texto si realmente hay contenido nuevo
    const finalText = finalTranscript.trim();
    const currentText = currentTranscript.trim();
    
    if (finalText || currentText) {
      const textToSend = finalText + (currentText ? ' ' + currentText : '');
      if (textToSend.trim()) {
        onTranscript(textToSend.trim());
      }
    }
    
    // Limpiar el estado después de enviar
    setCurrentTranscript('');
    setFinalTranscript('');
  }, [clearTimeouts, finalTranscript, currentTranscript, onTranscript]);

  const toggleListening = useCallback(() => {
    if (!isSupported || disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, disabled, isListening, stopListening, startListening]);

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`text-gray-500 ${className}`}
        title="Reconocimiento de voz no soportado"
      >
        <MicOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <>
      <VoiceIndicator isListening={isListening} />
      
      <div className="relative">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={toggleListening}
          disabled={disabled}
          className={`transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
          } ${className}`}
          title={isListening ? 'Detener grabación' : 'Grabar voz'}
        >
          {isListening ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
        
        {error && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-800 dark:text-red-200 whitespace-nowrap z-10">
            {error}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-200 dark:border-t-red-800"></div>
          </div>
        )}
      </div>
    </>
  );
} 