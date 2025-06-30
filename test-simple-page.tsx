'use client';

import React from 'react';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          ✅ Página de Prueba
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Si puedes ver esta página, Next.js está funcionando correctamente sin errores de chunks.
        </p>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
          <p className="text-green-800 dark:text-green-200 text-sm">
            El error de "Failed to load chunk app-pages-internals" ha sido resuelto.
          </p>
        </div>
      </div>
    </div>
  );
} 