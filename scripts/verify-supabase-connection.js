#!/usr/bin/env node

/**
 * Script para verificar la conexión a Supabase en la nube
 * Confirma que la configuración local está conectada correctamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySupabaseConnection() {
  console.log('🔍 Verificando conexión a Supabase...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Variables de entorno:');
  console.log(`   URL: ${supabaseUrl ? '✅ Configurada' : '❌ Faltante'}`);
  console.log(`   Anon Key: ${supabaseKey ? '✅ Configurada' : '❌ Faltante'}`);
  console.log(`   Service Role Key: ${serviceRoleKey ? '✅ Configurada' : '❌ Faltante'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno necesarias');
    console.log('💡 Crea un archivo .env.local con:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio');
    process.exit(1);
  }

  try {
    // Crear cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔌 Probando conexión a Supabase...');

    // Verificar conexión básica
    const { data: healthData, error: healthError } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Error de conexión:', healthError.message);
      process.exit(1);
    }

    console.log('✅ Conexión exitosa a Supabase en la nube!\n');

    // Verificar tablas principales
    console.log('📊 Verificando estructura de base de datos...');
    
    const tables = ['documents', 'chunks', 'embeddings', 'chat_history'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ${table}: ❌ Error - ${error.message}`);
        } else {
          console.log(`   ${table}: ✅ Disponible`);
        }
      } catch (err) {
        console.log(`   ${table}: ❌ Error - ${err.message}`);
      }
    }

    console.log('\n🔍 Verificando funciones RPC...');
    
    // Verificar funciones RPC
    const functions = [
      'match_documents',
      'search_chunks_bm25',
      'extract_articles'
    ];

    for (const func of functions) {
      try {
        // Intentar llamar la función con parámetros mínimos
        const { data, error } = await supabase.rpc(func, {
          query_embedding: new Array(768).fill(0), // Vector dummy
          match_threshold: 0.01,
          match_count: 1
        });
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`   ${func}: ❌ No encontrada`);
        } else {
          console.log(`   ${func}: ✅ Disponible`);
        }
      } catch (err) {
        console.log(`   ${func}: ❌ Error - ${err.message}`);
      }
    }

    // Verificar documentos existentes
    console.log('\n📚 Verificando documentos existentes...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('document_id, source, doc_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (docsError) {
      console.log('   ❌ Error al obtener documentos:', docsError.message);
    } else {
      console.log(`   📄 Documentos encontrados: ${documents?.length || 0}`);
      if (documents && documents.length > 0) {
        console.log('   📋 Últimos documentos:');
        documents.forEach((doc, index) => {
          console.log(`      ${index + 1}. ${doc.source} (${doc.doc_type}) - ${new Date(doc.created_at).toLocaleDateString()}`);
        });
      }
    }

    // Verificar chunks
    console.log('\n🧩 Verificando chunks...');
    const { data: chunks, error: chunksError } = await supabase
      .from('chunks')
      .select('chunk_id, document_id')
      .limit(1);

    if (chunksError) {
      console.log('   ❌ Error al obtener chunks:', chunksError.message);
    } else {
      console.log(`   ✅ Chunks disponibles: ${chunks ? 'Sí' : 'No'}`);
    }

    // Verificar embeddings
    console.log('\n🔢 Verificando embeddings...');
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('embedding_id, chunk_id')
      .limit(1);

    if (embeddingsError) {
      console.log('   ❌ Error al obtener embeddings:', embeddingsError.message);
    } else {
      console.log(`   ✅ Embeddings disponibles: ${embeddings ? 'Sí' : 'No'}`);
    }

    console.log('\n🎉 ¡Verificación completada!');
    console.log('✅ Tu entorno local está conectado correctamente a Supabase en la nube');
    console.log('📤 Los documentos que subas localmente se guardarán en la nube');
    console.log('🌐 Puedes acceder a ellos desde cualquier lugar');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

// Ejecutar verificación
verifySupabaseConnection().catch(console.error); 