'use client';

import { FileUpload } from "@/components/FileUpload";
import { Navigation } from "@/components/navigation";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation currentPage="upload" />
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Carga de Documentos Legales
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sube tus documentos legales para que el asistente pueda analizarlos y responder 
            a tus consultas con información específica de tus documentos.
          </p>
        </div>

        {/* Información sobre tipos de documentos */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tipos de Documentos Soportados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Documentos Legales</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Leyes, reglamentos, códigos y normativas oficiales
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contratos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contratos comerciales, laborales, de arrendamiento, etc.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Formatos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  DOCX, PDF, TXT (máximo 10MB por archivo)
                </p>
              </div>
            </div>
          </div>
        </div>

        <FileUpload />
      </div>
    </div>
  );
} 