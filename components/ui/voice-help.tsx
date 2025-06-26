import React, { useState } from 'react';
import { HelpCircle, X, Mic, Volume2 } from 'lucide-react';
import { Button } from './button';

export function VoiceHelp() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        title="Ayuda con el input por voz"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Input por Voz
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              ¿Cómo funciona?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Haz clic en el botón del micrófono y habla tu consulta legal. 
              El sistema transcribirá automáticamente tu voz a texto.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Consejos para mejores resultados:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-start space-x-2">
                <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Habla claramente y a un volumen normal</span>
              </li>
              <li className="flex items-start space-x-2">
                <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Evita ruidos de fondo</span>
              </li>
              <li className="flex items-start space-x-2">
                <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Usa términos legales específicos</span>
              </li>
              <li className="flex items-start space-x-2">
                <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Pausa brevemente entre frases</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> El reconocimiento de voz funciona mejor en navegadores modernos 
              como Chrome, Edge y Safari. Asegúrate de permitir el acceso al micrófono cuando el navegador lo solicite.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setIsOpen(false)}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
} 