import React, { useState } from 'react';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Plus, MessageSquare, FileText, Settings, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Consulta sobre contratos', date: '2024-01-15' },
    { id: 2, title: 'Análisis de regulaciones', date: '2024-01-14' },
    { id: 3, title: 'Revisión de documentos', date: '2024-01-13' },
  ]);

  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const startNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: `Nueva conversación ${conversations.length + 1}`,
      date: new Date().toISOString().split('T')[0]
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
  };

  return (
    <div
      className={`transition-all duration-300 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${collapsed ? 'w-16' : 'w-80'}`}
    >
      {/* Header con Logo */}
      <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center ${collapsed ? 'justify-center' : ''}`}>
        {/* Logo eliminado */}
        {/* Mostrar texto solo si no está colapsado */}
        {!collapsed && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-2">
            Asistente legal inteligente
          </p>
        )}
      </div>

      {/* Botón Nueva Conversación */}
      <div className={`p-4 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <Button onClick={startNewConversation} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            onClick={startNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Conversación
          </Button>
        )}
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto">
        <div className={`px-4 ${collapsed ? 'px-0' : ''}`}>
          {!collapsed && (
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversaciones Recientes
            </h3>
          )}
          <div className="space-y-2">
            {collapsed ? (
              <div className="flex flex-col items-center space-y-2">
                {conversations.slice(0, 3).map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation.id)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      activeConversation === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                    title={conversation.title}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </div>
                ))}
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversation === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className="font-medium text-sm truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conversation.date}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Botón para colapsar/expandir al fondo */}
      <div className="flex justify-center py-2">
        {collapsed ? (
          <button
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full shadow p-1 transition-all duration-300"
            style={{ outline: 'none' }}
            onClick={() => setCollapsed(false)}
            aria-label="Expandir menú"
          >
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full shadow p-1 transition-all duration-300"
            style={{ outline: 'none' }}
            onClick={() => setCollapsed(true)}
            aria-label="Colapsar menú"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Footer con opciones */}
      <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${collapsed ? 'flex flex-col items-center space-y-4' : ''}`}>
        <div className={collapsed ? 'flex flex-col items-center space-y-4' : 'space-y-2'}>
          <Link href="/upload" className={`transition-colors rounded-md flex items-center ${collapsed ? 'justify-center p-2' : 'w-full px-3 py-2 text-sm'} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}>
            <Upload className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Subir Documentos</span>}
          </Link>
          <Link href="/documents" className={`transition-colors rounded-md flex items-center ${collapsed ? 'justify-center p-2' : 'w-full px-3 py-2 text-sm'} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}>
            <FileText className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Documentos</span>}
          </Link>
          <button className={`transition-colors rounded-md flex items-center ${collapsed ? 'justify-center p-2' : 'w-full px-3 py-2 text-sm'} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}>
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Configuración</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;