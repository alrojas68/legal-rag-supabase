import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Configuración de la conexión
let connectionString = process.env.DATABASE_URL;

// Si no hay DATABASE_URL, construir desde variables de Supabase
if (!connectionString) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('DATABASE_URL o NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configurados');
  }
  
  // Construir URL de conexión directa a PostgreSQL
  // Cambiar https:// por postgresql:// y agregar credenciales
  const dbUrl = supabaseUrl.replace('https://', 'postgresql://postgres:');
  connectionString = `${dbUrl}@${supabaseUrl.replace('https://', '').replace('.supabase.co', '.supabase.co:5432')}/postgres`;
}

console.log('🔗 Conectando a base de datos con Drizzle...');

// Crear cliente de postgres
const client = postgres(connectionString, {
  max: 10, // Máximo de conexiones
  idle_timeout: 20, // Tiempo de inactividad
  connect_timeout: 10, // Tiempo de conexión
  ssl: 'require', // Requerir SSL para Supabase
});

// Crear instancia de Drizzle
export const db = drizzle(client, { schema });

// Exportar el cliente para uso directo si es necesario
export { client as postgresClient };

// Función para cerrar la conexión (útil para tests)
export async function closeConnection() {
  await client.end();
} 