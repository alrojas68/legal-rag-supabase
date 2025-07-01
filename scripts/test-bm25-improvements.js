#!/usr/bin/env node

/**
 * Script para probar las mejoras de BM25
 * Ejecutar: node scripts/test-bm25-improvements.js
 */

// Usar fetch nativo (disponible en Node.js 18+)
// const fetch = require('node-fetch'); // Comentado - usar fetch nativo

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Queries de prueba
const testQueries = [
  'derechos civiles',
  'artículo 19',
  'registro civil',
  'acta de nacimiento',
  'obligaciones legales',
  'responsabilidad civil',
  'procedimiento administrativo',
  'documentos oficiales',
  'ley federal',
  'código civil'
];

async function testBM25Improvements() {
  console.log('🧪 Probando mejoras de BM25...\n');
  
  for (const query of testQueries) {
    console.log(`\n🔍 Probando query: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      // Probar endpoint de mejoras
      const response = await fetch(`${BASE_URL}/api/test-bm25-improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        console.error(`❌ Error HTTP: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error(`❌ Error en prueba: ${result.error}`);
        continue;
      }
      
      // Mostrar análisis comparativo
      console.log(`📊 Análisis para "${query}":`);
      console.log(`   - Total de pruebas: ${result.analysis.total_tests}`);
      console.log(`   - Pruebas exitosas: ${result.analysis.successful_tests}`);
      console.log(`   - Promedio de resultados: ${result.analysis.average_results.toFixed(2)}`);
      console.log(`   - Mejor rendimiento: ${result.analysis.best_performing}`);
      
      // Mostrar resultados por método
      console.log('\n📋 Resultados por método:');
      for (const [method, data] of Object.entries(result.results)) {
        if (data.success) {
          console.log(`   ✅ ${method}: ${data.count} resultados`);
          if (data.results.length > 0) {
            const firstResult = data.results[0];
            console.log(`      Primer resultado: ${firstResult.chunk_text?.substring(0, 100)}...`);
            console.log(`      Score: ${firstResult.rank_score?.toFixed(4) || 'N/A'}`);
          }
        } else {
          console.log(`   ❌ ${method}: ${data.error}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error al probar "${query}":`, error.message);
    }
  }
}

async function testSpecificQuery() {
  const query = process.argv[2] || 'derechos civiles';
  console.log(`\n🎯 Probando query específica: "${query}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/search-bm25`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        limit: 5,
        k1: 1.5,  // Parámetro optimizado para documentos largos
        b: 0.5    // Parámetro optimizado para documentos largos
      })
    });
    
    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error(`❌ Error: ${result.error}`);
      return;
    }
    
    console.log(`✅ BM25 mejorado encontró ${result.count} resultados`);
    console.log(`📊 Método usado: ${result.method}`);
    console.log(`⚙️ Parámetros: ${JSON.stringify(result.parameters)}`);
    
    console.log('\n📋 Resultados:');
    result.results.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.source || 'Documento legal'}`);
      console.log(`   Score: ${doc.rank_score?.toFixed(4) || 'N/A'}`);
      console.log(`   Contenido: ${doc.content?.substring(0, 200)}...`);
      if (doc.highlighted_content) {
        console.log(`   Resaltado: ${doc.highlighted_content?.substring(0, 200)}...`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  if (command === 'specific') {
    await testSpecificQuery();
  } else {
    await testBM25Improvements();
  }
}

// Ejecutar si es el script principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBM25Improvements, testSpecificQuery }; 