import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Crear cliente de Supabase
    const supabase = await createClient();

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('session_id') || 'default-session';

    // Construir la consulta
    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: chatHistory, error } = await query;

    if (error) {
      console.error('Error al obtener historial de chat:', error);
      return NextResponse.json({
        error: 'Error al obtener historial de chat',
        success: false
      }, { status: 500 });
    }

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
    // Crear cliente de Supabase
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chat_id');
    const sessionId = searchParams.get('session_id') || 'default-session';

    if (!chatId && !sessionId) {
      return NextResponse.json({
        error: 'Se requiere chat_id o session_id para eliminar',
        success: false
      }, { status: 400 });
    }

    let query = supabase
      .from('chat_history')
      .delete();

    if (chatId) {
      query = query.eq('chat_id', chatId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error al eliminar historial de chat:', error);
      return NextResponse.json({
        error: 'Error al eliminar historial de chat',
        success: false
      }, { status: 500 });
    }

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