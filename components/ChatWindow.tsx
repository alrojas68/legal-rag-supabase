import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { VoiceInputV2 } from './ui/voice-input-v2';
import { VoiceHelp } from './ui/voice-help';
import Link from 'next/link';

interface Message {
  role: string;
  content: string;
  vectorial_response?: any[];
  referenced_articles_by_method?: any[];
  llm_response?: string;
  referenced_articles_combined?: any[];
  bm25_results?: any[];
  vectorial_results?: any[];
  mixed_context?: any[];
  search_stats?: any;
  response_vectorial?: string;
  response_bm25?: string;
  response_combined?: string;
  referenced_articles?: any;
}

const ChatWindow = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Si se presiona Enter, enviar el mensaje
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevenir el comportamiento por defecto
      handleSendMessage();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  // Función para resaltar artículos de la ley
  const highlightArticles = (text: string) => {
    // Buscar patrones como "ARTÍCULO 123", "artículo 456", etc.
    const articleRegex = /(art[íi]culo\s+\d+)/gi;
    return text.replace(articleRegex, (match) => {
      return `<span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">${match}</span>`;
    });
  };

  // Función para extraer artículos de un texto
  const extractArticles = (text: string) => {
    const articleRegex = /art[íi]culo\s+\d+/gi;
    const matches = text.match(articleRegex);
    return matches ? [...new Set(matches)] : [];
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': 'default-session'
        },
        body: JSON.stringify({ 
          query: input,
          messages: messages
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.llm_response || data.response,
          vectorial_response: data.vectorial_response,
          referenced_articles_by_method: data.referenced_articles_by_method,
          llm_response: data.llm_response,
          referenced_articles_combined: data.referenced_articles_combined,
          bm25_results: data.bm25_results,
          vectorial_results: data.vectorial_results,
          mixed_context: data.mixed_context,
          search_stats: data.search_stats,
          response_vectorial: data.response_vectorial,
          response_bm25: data.response_bm25,
          response_combined: data.response_combined,
          referenced_articles: data.referenced_articles
        };
        setMessages([...newMessages, assistantMessage]);
      } else {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: `Error: ${data.error || 'Error desconocido'}` 
        }]);
      }
    } catch (err) {
      console.error('Error en la petición:', err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Error al conectar con el servidor. Por favor, intenta de nuevo.' 
      }]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-gray-50 dark:bg-gray-900">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¡Bienvenido a tu Asistente Legal!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Soy tu asistente legal inteligente. Puedo ayudarte con consultas sobre leyes, 
              regulaciones, contratos y más. ¿En qué puedo ayudarte hoy?
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  "¿Cuáles son los requisitos para obtener la nacionalidad mexicana?"
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  "¿Qué derechos tengo como inquilino?"
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/upload">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Subir Documentos para Análisis
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
              }`}>
                <p className="text-base whitespace-pre-wrap">{message.content}</p>
                
                {/* 3. Respuesta del LLM */}
                {message.role === 'assistant' && message.llm_response && (
                  <div className="mb-4">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Respuesta del Asistente Legal
                      </h3>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {message.llm_response}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Artículos Referenciados por Método */}
                {message.role === 'assistant' && message.referenced_articles_by_method && message.referenced_articles_by_method.length > 0 && (
                  <div className="mt-4">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Artículos Referenciados por Método ({message.referenced_articles_by_method.length})
                      </h3>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                        <div className="space-y-3">
                          {message.referenced_articles_by_method.map((article, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-600 shadow-sm">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                  Artículo {article.article_number}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {article.source}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex space-x-1">
                                  {article.methods.includes('vectorial') && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                                      Vectorial
                                    </span>
                                  )}
                                  {article.methods.includes('bm25') && (
                                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-medium">
                                      BM25
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  Score: {article.highest_score?.toFixed(3)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Respuesta Vectorial */}
                {message.role === 'assistant' && message.vectorial_response && message.vectorial_response.length > 0 && (
                  <div className="mt-4">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2" />
                        Respuesta Vectorial (Semántica)
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {message.vectorial_response.slice(0, 3).map((doc: any, idx: number) => {
                            const articles = extractArticles(doc.content);
                            return (
                              <div key={idx} className="bg-white dark:bg-gray-700 rounded p-3 border border-blue-200 dark:border-blue-600">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    {doc.source}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Similitud: {doc.similarity_score?.toFixed(4)}
                                  </span>
                                </div>
                                <div 
                                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                                  dangerouslySetInnerHTML={{ 
                                    __html: highlightArticles(doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''))
                                  }}
                                />
                                {articles.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {articles.slice(0, 3).map((article, articleIdx) => (
                                      <span 
                                        key={articleIdx}
                                        className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full"
                                      >
                                        {article}
                                      </span>
                                    ))}
                                    {articles.length > 3 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{articles.length - 3} más
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Artículos Referenciados Combinados */}
                {message.role === 'assistant' && message.referenced_articles_combined && message.referenced_articles_combined.length > 0 && (
                  <div className="mt-4">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Artículos Referenciados Combinados ({message.referenced_articles_combined.length})
                      </h3>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                        <div className="space-y-3">
                          {message.referenced_articles_combined.map((article, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-600 shadow-sm">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                  Artículo {article.article_number}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {article.source}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex space-x-1">
                                  {article.methods.includes('vectorial') && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                                      Vectorial
                                    </span>
                                  )}
                                  {article.methods.includes('bm25') && (
                                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-medium">
                                      BM25
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  Score: {article.highest_score?.toFixed(3)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Respuesta SOLO Vectorial */}
                {message.role === 'assistant' && message.response_vectorial && (
                  <div className="mb-4">
                    <div className="border-t border-blue-200 dark:border-blue-600 pt-4">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Respuesta SOLO Vectorial
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {message.response_vectorial}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Respuesta SOLO BM25 */}
                {message.role === 'assistant' && message.response_bm25 && (
                  <div className="mb-4">
                    <div className="border-t border-green-200 dark:border-green-600 pt-4">
                      <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Respuesta SOLO BM25
                      </h3>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {message.response_bm25}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Respuesta Combinada (Vectorial + BM25) */}
                {message.role === 'assistant' && message.response_combined && (
                  <div className="mb-4">
                    <div className="border-t border-purple-200 dark:border-purple-600 pt-4">
                      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Respuesta Combinada (Vectorial + BM25)
                      </h3>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {message.response_combined}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Artículos Referenciados Agrupados */}
                {message.role === 'assistant' && message.referenced_articles && (
                  <div className="mt-4">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Artículos Referenciados
                      </h3>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                        <div className="space-y-3">
                          {/* Ambos métodos */}
                          {message.referenced_articles.both && message.referenced_articles.both.length > 0 && (
                            <div>
                              <div className="font-semibold text-sm text-green-700 dark:text-green-300 mb-1">En ambos métodos</div>
                              {message.referenced_articles.both.map((article: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600 shadow-sm mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                      Artículo {article.article_number}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {article.source}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Exclusivos Vectorial y BM25 en columnas */}
                          {(message.referenced_articles.only_vectorial?.length > 0 || message.referenced_articles.only_bm25?.length > 0) && (
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Solo Vectorial */}
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">Solo Vectorial</div>
                                {message.referenced_articles.only_vectorial?.length > 0 ? (
                                  message.referenced_articles.only_vectorial.map((article: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 shadow-sm mb-2">
                                      <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                          Artículo {article.article_number}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {article.source}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Ninguno</div>
                                )}
                              </div>
                              {/* Solo BM25 */}
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-green-700 dark:text-green-300 mb-1">Solo BM25</div>
                                {message.referenced_articles.only_bm25?.length > 0 ? (
                                  message.referenced_articles.only_bm25.map((article: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-600 shadow-sm mb-2">
                                      <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                          Artículo {article.article_number}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {article.source}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Ninguno</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultados crudos de Vectorial */}
                {message.role === 'assistant' && message.vectorial_results && message.vectorial_results.length > 0 && (
                  <div className="mt-4">
                    <div className="border-t border-blue-200 dark:border-blue-600 pt-4">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Resultados Vectorial (crudos)
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {message.vectorial_results.map((doc: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-700 rounded p-3 border border-blue-200 dark:border-blue-600">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  {doc.source}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Similitud: {doc.similarity_score?.toFixed(4)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                {doc.content?.substring(0, 300) + (doc.content?.length > 300 ? '...' : '')}
                              </div>
                              {doc.article_number && (
                                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                  Artículo: {doc.article_number}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultados crudos de BM25 */}
                {message.role === 'assistant' && message.bm25_results && message.bm25_results.length > 0 && (
                  <div className="mt-4">
                    <div className="border-t border-green-200 dark:border-green-600 pt-4">
                      <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        Resultados BM25 (crudos)
                      </h3>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {message.bm25_results.map((doc: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-700 rounded p-3 border border-green-200 dark:border-green-600">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                  {doc.source}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Similitud: {doc.similarity_score?.toFixed(4)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                {doc.content?.substring(0, 300) + (doc.content?.length > 300 ? '...' : '')}
                              </div>
                              {doc.article_number && (
                                <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                                  Artículo: {doc.article_number}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pensando...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input del usuario */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={input}
              placeholder="Escribe tu consulta legal o usa el micrófono... (Presiona Enter para enviar)"
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          <VoiceInputV2 
            onTranscript={handleVoiceTranscript}
            disabled={loading}
            className="flex-shrink-0"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            El asistente puede cometer errores. Verifica siempre la información importante.
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Usa el micrófono para dictar tu consulta
            </p>
            <VoiceHelp />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 