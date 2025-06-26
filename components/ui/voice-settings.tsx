import React, { useState } from 'react';
import { Settings, Mic, Volume2, Clock } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { Slider } from './slider';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    silenceTimeout: number;
    maxAlternatives: number;
    continuous: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export function VoiceSettings({ isOpen, onClose, settings, onSettingsChange }: VoiceSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Voz
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Timeout de silencio */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Timeout de Silencio</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={[localSettings.silenceTimeout]}
                onValueChange={(value: number[]) => setLocalSettings(prev => ({ ...prev, silenceTimeout: value[0] }))}
                max={10}
                min={1}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {localSettings.silenceTimeout} segundos de silencio antes de enviar
              </p>
            </div>
          </div>

          {/* Alternativas máximas */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Alternativas de Reconocimiento</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={[localSettings.maxAlternatives]}
                onValueChange={(value: number[]) => setLocalSettings(prev => ({ ...prev, maxAlternatives: value[0] }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {localSettings.maxAlternatives} alternativa{localSettings.maxAlternatives > 1 ? 's' : ''} de reconocimiento
              </p>
            </div>
          </div>

          {/* Modo continuo */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Mic className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Modo Continuo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="continuous"
                checked={localSettings.continuous}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, continuous: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="continuous" className="text-sm">
                Mantener reconocimiento activo continuamente
              </Label>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Recomendado para consultas largas
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Consejo:</strong> Un timeout de silencio más largo te da más tiempo para pensar, 
              mientras que uno más corto envía el texto más rápidamente.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
} 