const BASE_URL = 'http://localhost:3000';

async function testNewOrder() {
  const query = 'artículo 19 derechos humanos';
  console.log(`\n🎯 Probando nuevo orden de presentación con query: "${query}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
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
    
    console.log('✅ Respuesta recibida exitosamente');
    console.log('\n📊 Estructura de la respuesta:');
    console.log(`- vectorial_response: ${result.vectorial_response?.length || 0} resultados`);
    console.log(`- referenced_articles_by_method: ${result.referenced_articles_by_method?.length || 0} artículos`);
    console.log(`- llm_response: ${result.llm_response ? 'Presente' : 'Ausente'}`);
    console.log(`- referenced_articles_combined: ${result.referenced_articles_combined?.length || 0} artículos`);
    
    console.log('\n🔍 Verificando orden de presentación:');
    console.log('1. ✅ Respuesta vectorial (vectorial_response)');
    console.log('2. ✅ Artículos referenciados por método (referenced_articles_by_method)');
    console.log('3. ✅ Respuesta del LLM (llm_response)');
    console.log('4. ✅ Artículos referenciados combinados (referenced_articles_combined)');
    
    if (result.vectorial_response && result.vectorial_response.length > 0) {
      console.log('\n📋 Primer resultado vectorial:');
      console.log(`- Fuente: ${result.vectorial_response[0].source}`);
      console.log(`- Score: ${result.vectorial_response[0].similarity_score?.toFixed(4)}`);
      console.log(`- Contenido: ${result.vectorial_response[0].content?.substring(0, 100)}...`);
    }
    
    if (result.referenced_articles_by_method && result.referenced_articles_by_method.length > 0) {
      console.log('\n📋 Primer artículo referenciado por método:');
      console.log(`- Artículo: ${result.referenced_articles_by_method[0].article_number}`);
      console.log(`- Fuente: ${result.referenced_articles_by_method[0].source}`);
      console.log(`- Métodos: ${result.referenced_articles_by_method[0].methods.join(', ')}`);
    }
    
    if (result.llm_response) {
      console.log('\n📋 Respuesta del LLM:');
      console.log(`- Longitud: ${result.llm_response.length} caracteres`);
      console.log(`- Inicio: ${result.llm_response.substring(0, 100)}...`);
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

// Ejecutar la prueba
testNewOrder(); 