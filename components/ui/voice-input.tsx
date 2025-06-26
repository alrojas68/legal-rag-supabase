import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './button';
import { VoiceIndicator } from './voice-indicator';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({ onTranscript, disabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar el timeout
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Función para reiniciar el reconocimiento
  const restartRecognition = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (isListening) {
            recognitionRef.current.start();
          }
        }, 100);
      } catch (err) {
        console.error('Error al reiniciar reconocimiento:', err);
      }
    }
  }, [isListening]);

  useEffect(() => {
    // Verificar si el navegador soporta reconocimiento de voz
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      // Configuración mejorada para mayor duración
      recognition.continuous = true; // Mantener activo
      recognition.interimResults = true; // Resultados intermedios
      recognition.maxAlternatives = 1;
      recognition.lang = 'es-MX'; // Español de México
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        console.log('Reconocimiento de voz iniciado');
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        
        // Si hay texto final, enviarlo
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        
        // Manejar errores específicos
        if (event.error === 'no-speech') {
          // No hacer nada, es normal
          return;
        }
        
        if (event.error === 'network') {
          setError('Error de red. Verifica tu conexión.');
          setIsListening(false);
          return;
        }
        
        if (event.error === 'not-allowed') {
          setError('Permiso denegado para usar el micrófono.');
          setIsListening(false);
          return;
        }
        
        if (event.error === 'audio-capture') {
          setError('Error al capturar audio. Verifica tu micrófono.');
          setIsListening(false);
          return;
        }
        
        // Para otros errores, intentar reiniciar
        if (isListening) {
          console.log('Reintentando reconocimiento de voz...');
          setTimeout(() => {
            if (isListening) {
              restartRecognition();
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        console.log('Reconocimiento de voz terminado');
        
        // Si aún debería estar escuchando, reiniciar
        if (isListening) {
          console.log('Reiniciando reconocimiento de voz...');
          setTimeout(() => {
            if (isListening) {
              try {
                recognition.start();
              } catch (err) {
                console.error('Error al reiniciar:', err);
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };
      
      recognition.onaudiostart = () => {
        console.log('Audio iniciado');
      };
      
      recognition.onaudioend = () => {
        console.log('Audio terminado');
      };
      
      recognition.onsoundstart = () => {
        console.log('Sonido detectado');
      };
      
      recognition.onsoundend = () => {
        console.log('Sonido terminado');
      };
      
      recognition.onspeechstart = () => {
        console.log('Habla iniciada');
      };
      
      recognition.onspeechend = () => {
        console.log('Habla terminada');
      };
      
    } else {
      setIsSupported(false);
      setError('Tu navegador no soporta reconocimiento de voz');
    }
    
    // Cleanup
    return () => {
      clearTimeoutRef();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error al limpiar reconocimiento:', err);
        }
      }
    };
  }, [onTranscript, clearTimeoutRef, restartRecognition]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'No se detectó voz. Intenta de nuevo.';
      case 'audio-capture':
        return 'Error al capturar audio. Verifica tu micrófono.';
      case 'not-allowed':
        return 'Permiso denegado para usar el micrófono.';
      case 'network':
        return 'Error de red. Verifica tu conexión.';
      default:
        return 'Error en el reconocimiento de voz. Intenta de nuevo.';
    }
  };

  const toggleListening = () => {
    if (!isSupported || disabled) return;
    
    if (isListening) {
      setIsListening(false);
      clearTimeoutRef();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error al detener reconocimiento:', err);
        }
      }
    } else {
      setIsListening(true);
      setError(null);
      setTranscript('');
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Error al iniciar reconocimiento de voz:', err);
          setError('Error al iniciar el reconocimiento de voz');
          setIsListening(false);
        }
      }
    }
  };

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
            <Loader2 className="w-4 h-4 animate-spin" />
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