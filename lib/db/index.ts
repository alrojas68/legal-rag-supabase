import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Solo usar Drizzle en producción (Vercel)
const isProduction = process.env.NODE_ENV === 'production';

let db: any;
let postgresClient: any;
let closeConnection: () => Promise<void>;

if (isProduction) {
  // En producción (Vercel), usar Drizzle con conexión directa a Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de entorno de Supabase requeridas en producción');
  }
  
  // Construir URL de conexión directa para Vercel
  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  const connectionString = `postgresql://postgres:${supabaseServiceKey}@db.${projectId}.supabase.co:5432/postgres`;

  console.log('🔗 Conectando a base de datos con Drizzle (PRODUCCIÓN)...');
  console.log('🔗 URL de conexión:', connectionString.substring(0, 50) + '...');

  // Crear cliente de postgres para producción
  postgresClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require',
  });

  // Crear instancia de Drizzle para producción
  db = drizzle(postgresClient, { schema });

  // Función para cerrar la conexión
  closeConnection = async () => {
    await postgresClient.end();
  };
} else {
  // En desarrollo, exportar un mock de Drizzle que usa Supabase directo
  console.log('🔗 Usando Supabase directo en desarrollo (Drizzle deshabilitado)');
  
  // Mock de Drizzle para desarrollo
  db = {
    execute: async (query: string, params?: any[]) => {
      console.warn('⚠️ Drizzle no disponible en desarrollo. Usa Supabase directo.');
      throw new Error('Drizzle no disponible en desarrollo. Usa Supabase directo.');
    }
  };
  
  postgresClient = null;
  closeConnection = async () => {
    // No hacer nada en desarrollo
  };
}

export { db, postgresClient, closeConnection }; 