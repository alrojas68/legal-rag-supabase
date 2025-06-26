import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const source = formData.get('source') as string;
    
    return NextResponse.json({
      success: true,
      message: 'Endpoint de prueba funcionando',
      fileName: file?.name,
      source: source,
      fileSize: file?.size
    });

  } catch (error) {
    console.error('Error en test-upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 