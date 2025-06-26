#!/usr/bin/env node

/**
 * Script para probar el endpoint de chat (versión MVP sin autenticación)
 * Uso: node scripts/test-chat-endpoint.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

async function testChatEndpoint() {
  console.log('🧪 Probando endpoint de chat (MVP sin autenticación)...\n');

  try {
    // Test 1: Enviar consulta básica
    console.log('📝 Test 1: Enviando consulta básica...');
    const response1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '¿Qué es la Constitución Mexicana?',
        messages: []
      })
    });

    const data1 = await response1.json();
    console.log('✅ Status:', response1.status);
    console.log('📄 Respuesta:', data1.success ? 'Éxito' : 'Error');
    if (data1.success) {
      console.log('💬 Respuesta del AI:', data1.response.substring(0, 100) + '...');
      console.log('📚 Documentos encontrados:', data1.documents?.length || 0);
    } else {
      console.log('❌ Error:', data1.error);
    }
    console.log('');

    // Test 2: Enviar consulta con historial y sesión personalizada
    console.log('📝 Test 2: Enviando consulta con historial y sesión personalizada...');
    const response2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test-session-123'
      },
      body: JSON.stringify({
        query: '¿Cuáles son los derechos fundamentales?',
        messages: [
          {
            role: 'user',
            content: 'Hola, necesito información sobre derechos constitucionales'
          },
          {
            role: 'assistant',
            content: 'Te ayudo con información sobre los derechos constitucionales en México.'
          }
        ]
      })
    });

    const data2 = await response2.json();
    console.log('✅ Status:', response2.status);
    console.log('📄 Respuesta:', data2.success ? 'Éxito' : 'Error');
    if (data2.success) {
      console.log('💬 Respuesta del AI:', data2.response.substring(0, 100) + '...');
    } else {
      console.log('❌ Error:', data2.error);
    }
    console.log('');

    // Test 3: Probar endpoint de historial (sin autenticación)
    console.log('📝 Test 3: Probando endpoint de historial (sesión por defecto)...');
    const response3 = await fetch(`${BASE_URL}/api/chat/history?limit=5`);
    const data3 = await response3.json();
    console.log('✅ Status:', response3.status);
    console.log('📄 Respuesta:', data3.success ? 'Éxito' : 'Error');
    if (data3.success) {
      console.log('📚 Historial obtenido:', data3.chatHistory?.length || 0, 'registros');
      console.log('🆔 Sesión:', data3.sessionId);
    } else {
      console.log('❌ Error:', data3.error);
    }
    console.log('');

    // Test 4: Probar historial de sesión específica
    console.log('📝 Test 4: Probando historial de sesión específica...');
    const response4 = await fetch(`${BASE_URL}/api/chat/history?session_id=test-session-123&limit=5`);
    const data4 = await response4.json();
    console.log('✅ Status:', response4.status);
    console.log('📄 Respuesta:', data4.success ? 'Éxito' : 'Error');
    if (data4.success) {
      console.log('📚 Historial de sesión específica:', data4.chatHistory?.length || 0, 'registros');
    } else {
      console.log('❌ Error:', data4.error);
    }
    console.log('');

    // Test 5: Probar consulta sin query (debe fallar)
    console.log('📝 Test 5: Probando consulta sin query (debe fallar)...');
    const response5 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: []
      })
    });

    const data5 = await response5.json();
    console.log('✅ Status:', response5.status);
    console.log('📄 Respuesta esperada: Error');
    console.log('❌ Error:', data5.error);
    console.log('');

    console.log('🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Función para probar con diferentes consultas
async function testSpecificQueries() {
  console.log('🔍 Probando consultas específicas...\n');

  const queries = [
    '¿Cuáles son los requisitos para obtener la nacionalidad mexicana?',
    '¿Qué dice la Constitución sobre la libertad de expresión?',
    '¿Cuáles son los derechos de los trabajadores?',
    '¿Qué es el amparo y cuándo se puede interponer?',
    '¿Cuáles son las garantías constitucionales?'
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`📝 Test ${i + 1}: "${query}"`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': `test-session-${i + 1}`
        },
        body: JSON.stringify({
          query: query,
          messages: []
        })
      });

      const data = await response.json();
      console.log('✅ Status:', response.status);
      
      if (data.success) {
        console.log('💬 Respuesta:', data.response.substring(0, 150) + '...');
        console.log('📚 Documentos:', data.documents?.length || 0);
      } else {
        console.log('❌ Error:', data.error);
      }
    } catch (error) {
      console.log('❌ Error de red:', error.message);
    }
    
    console.log('');
    
    // Esperar un poco entre consultas para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Función para probar eliminación de historial
async function testDeleteHistory() {
  console.log('🗑️ Probando eliminación de historial...\n');

  try {
    // Crear algunos chats en una sesión de prueba
    console.log('📝 Creando chats de prueba...');
    for (let i = 1; i <= 3; i++) {
      await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'delete-test-session'
        },
        body: JSON.stringify({
          query: `Consulta de prueba ${i}`,
          messages: []
        })
      });
    }

    // Verificar que se crearon
    const historyResponse = await fetch(`${BASE_URL}/api/chat/history?session_id=delete-test-session`);
    const historyData = await historyResponse.json();
    console.log('📚 Chats creados:', historyData.chatHistory?.length || 0);

    // Eliminar historial de la sesión
    console.log('🗑️ Eliminando historial de la sesión...');
    const deleteResponse = await fetch(`${BASE_URL}/api/chat/history?session_id=delete-test-session`, {
      method: 'DELETE'
    });
    const deleteData = await deleteResponse.json();
    console.log('✅ Status:', deleteResponse.status);
    console.log('📄 Respuesta:', deleteData.success ? 'Éxito' : 'Error');

    // Verificar que se eliminaron
    const finalHistoryResponse = await fetch(`${BASE_URL}/api/chat/history?session_id=delete-test-session`);
    const finalHistoryData = await finalHistoryResponse.json();
    console.log('📚 Chats restantes:', finalHistoryData.chatHistory?.length || 0);

  } catch (error) {
    console.error('❌ Error en prueba de eliminación:', error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas del endpoint de chat (MVP)...\n');
  
  await testChatEndpoint();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Descomentar las siguientes líneas para pruebas adicionales
  // await testSpecificQueries();
  // await testDeleteHistory();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testChatEndpoint, testSpecificQueries, testDeleteHistory }; 