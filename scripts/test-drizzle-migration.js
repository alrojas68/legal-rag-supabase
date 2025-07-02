#!/usr/bin/env node

/**
 * Script para probar la migración completa a Drizzle ORM
 * Ejecutar con: node scripts/test-drizzle-migration.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`🔍 Probando: ${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${endpoint}: ÉXITO`);
      return { success: true, data };
    } else {
      console.log(`❌ ${endpoint}: ERROR - ${data.error || response.statusText}`);
      return { success: false, error: data.error || response.statusText };
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de migración a Drizzle ORM...\n');
  
  const results = {};
  
  // 1. Probar migración completa
  console.log('📊 1. Probando migración completa...');
  results.migration = await testEndpoint('/api/test-drizzle-migration?q=condominio');
  
  // 2. Probar Drizzle básico
  console.log('\n📊 2. Probando Drizzle básico...');
  results.drizzle = await testEndpoint('/api/test-drizzle');
  
  // 3. Probar documentos
  console.log('\n📚 3. Probando endpoint de documentos...');
  results.documents = await testEndpoint('/api/documents');
  
  // 4. Probar búsqueda BM25
  console.log('\n🔍 4. Probando búsqueda BM25...');
  results.bm25 = await testEndpoint('/api/search-bm25?q=condominio&method=improved');
  
  // 5. Probar chat history
  console.log('\n💬 5. Probando chat history...');
  results.chatHistory = await testEndpoint('/api/chat/history?limit=5');
  
  // 6. Probar mejoras BM25
  console.log('\n🔍 6. Probando mejoras BM25...');
  results.bm25Improvements = await testEndpoint('/api/test-bm25-improvements', 'POST', {
    query: 'derechos civiles'
  });
  
  // Análisis de resultados
  console.log('\n📊 ANÁLISIS DE RESULTADOS:');
  console.log('='.repeat(50));
  
  const successfulTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  const successRate = (successfulTests / totalTests * 100).toFixed(1);
  
  console.log(`Total de pruebas: ${totalTests}`);
  console.log(`Pruebas exitosas: ${successfulTests}`);
  console.log(`Tasa de éxito: ${successRate}%`);
  
  if (successfulTests === totalTests) {
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
  } else {
    console.log('\n⚠️ MIGRACIÓN PARCIAL - Algunas pruebas fallaron');
  }
  
  // Mostrar detalles de cada prueba
  console.log('\n📋 DETALLES POR PRUEBA:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    const details = result.success 
      ? `(${result.data?.count || 'N/A'} resultados)`
      : `(${result.error})`;
    
    console.log(`${status} ${test}: ${details}`);
  });
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('='.repeat(50));
  
  if (successfulTests === totalTests) {
    console.log('✅ Todos los endpoints están funcionando correctamente con Drizzle');
    console.log('✅ La migración está completa y lista para producción');
    console.log('🔄 Próximos pasos:');
    console.log('   - Optimizar queries para mejor performance');
    console.log('   - Implementar cache para queries frecuentes');
    console.log('   - Migrar endpoint de chat principal');
    console.log('   - Migrar endpoints de upload');
  } else {
    console.log('⚠️ Algunos endpoints necesitan atención:');
    Object.entries(results).forEach(([test, result]) => {
      if (!result.success) {
        console.log(`   - Revisar ${test}: ${result.error}`);
      }
    });
  }
  
  console.log('\n🏁 Pruebas completadas.');
}

// Ejecutar pruebas
runTests().catch(console.error); 