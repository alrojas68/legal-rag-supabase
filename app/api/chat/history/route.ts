import { NextRequest, NextResponse } from 'next/server';
import { getChatHistory, deleteChatHistory } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    console.log('💬 Endpoint /api/chat/history: Obteniendo historial con Drizzle...');
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('session_id') || 'default-session';

    const chatHistory = await getChatHistory(sessionId, limit);

    return NextResponse.json({
      success: true,
      chatHistory: chatHistory || [],
      total: chatHistory?.length || 0,
      limit,
      offset,
      sessionId
    });

  } catch (error) {
    console.error('Error en el endpoint de historial de chat:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ Endpoint /api/chat/history: Eliminando historial con Drizzle...');
    
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chat_id');
    const sessionId = searchParams.get('session_id') || 'default-session';

    if (!chatId && !sessionId) {
      return NextResponse.json({
        error: 'Se requiere chat_id o session_id para eliminar',
        success: false
      }, { status: 400 });
    }

    await deleteChatHistory(chatId || undefined, sessionId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Historial de chat eliminado correctamente'
    });

  } catch (error) {
    console.error('Error en el endpoint de eliminación de historial:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    }, { status: 500 });
  }
} 