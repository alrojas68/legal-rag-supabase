// Script para verificar variables de entorno
console.log('🔍 Verificando variables de entorno...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_API_KEY'
];

const missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`);
    missingVars.push(varName);
  }
});

console.log('\n📊 Resumen:');
if (missingVars.length === 0) {
  console.log('✅ Todas las variables están configuradas');
} else {
  console.log(`❌ Faltan ${missingVars.length} variables:`);
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 Configura estas variables en Vercel:');
  console.log('   Settings > Environment Variables');
} 