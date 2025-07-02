// Script para probar Drizzle en producción (Vercel)
const { execSync } = require('child_process');

console.log('🧪 Probando Drizzle en producción...');

try {
  // Simular entorno de producción
  process.env.NODE_ENV = 'production';
  
  // Probar la conexión
  const result = execSync('curl -s https://tu-app.vercel.app/api/test-drizzle-connection', { 
    encoding: 'utf8' 
  });
  
  console.log('✅ Resultado:', result);
  
  // Si funciona, ejecutar migraciones
  console.log('🔄 Ejecutando migraciones...');
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('✅ Migraciones completadas');
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 