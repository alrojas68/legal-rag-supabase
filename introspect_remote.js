const { execSync } = require('child_process');
const fs = require('fs');

// Cargar variables de entorno desde .env.local
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    // Ignorar comentarios y líneas vacías
    if (line.trim() && !line.trim().startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Establecer variables de entorno
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  console.log('Variables de entorno cargadas:', Object.keys(envVars));
}

// Ejecutar introspección
try {
  console.log('Ejecutando introspección de Drizzle con base de datos remota...');
  execSync('npx drizzle-kit introspect', { stdio: 'inherit' });
  console.log('Introspección completada exitosamente');
} catch (error) {
  console.error('Error durante la introspección:', error.message);
} 