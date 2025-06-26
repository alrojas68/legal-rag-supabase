import React from 'react';
import { Button } from './button';
import { AlertTriangle, X, FileText, Sparkles } from 'lucide-react';

interface TypeDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedType: 'user' | 'ia') => void;
  userType: string;
  iaType: string;
  warningMessage: string;
  isLoading?: boolean;
}

export function TypeDiscrepancyModal({
  isOpen,
  onClose,
  onConfirm,
  userType,
  iaType,
  warningMessage,
  isLoading = false
}: TypeDiscrepancyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Discrepancia en Tipo de Documento
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {warningMessage}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-col items-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white text-center">
                Seleccionado por usuario
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {userType}
              </span>
              <Button
                variant="outline"
                onClick={() => onConfirm('user')}
                disabled={isLoading}
                className="mt-3 w-full"
              >
                Usar selección del usuario
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-col items-center">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="font-medium text-gray-900 dark:text-white text-center">
                Sugerido por IA
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {iaType}
              </span>
              <Button
                variant="secondary"
                onClick={() => onConfirm('ia')}
                disabled={isLoading}
                className="mt-3 w-full"
              >
                Usar sugerencia de IA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 