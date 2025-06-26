import { pgTable, uuid, text, timestamp, integer, boolean, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabla de documentos
export const documents = pgTable('documents', {
  documentId: uuid('document_id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  publicationDate: date('publication_date'),
  lastReformDate: date('last_reform_date'),
  jurisdiction: text('jurisdiction'),
  docType: text('doc_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de secciones
export const sections = pgTable('sections', {
  sectionId: uuid('section_id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.documentId).notNull(),
  parentSectionId: uuid('parent_section_id'),
  sectionType: text('section_type'),
  sectionNumber: text('section_number'),
  contentHash: text('content_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de chunks
export const chunks = pgTable('chunks', {
  chunkId: uuid('chunk_id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').references(() => sections.sectionId).notNull(),
  documentId: uuid('document_id').references(() => documents.documentId),
  chunkText: text('chunk_text').notNull(),
  charCount: integer('char_count').notNull(),
  startPage: integer('start_page'),
  endPage: integer('end_page'),
  chunkOrder: integer('chunk_order'),
  vectorId: uuid('vector_id'),
  // Campos de jerarquía legal
  hierarchyId: uuid('hierarchy_id'),
  legalDocumentName: text('legal_document_name'),
  legalDocumentCode: text('legal_document_code'),
  articleNumber: text('article_number'),
  sectionNumber: text('section_number'),
  paragraphNumber: text('paragraph_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de embeddings
export const embeddings = pgTable('embeddings', {
  vectorId: uuid('vector_id').primaryKey().defaultRandom(),
  chunkId: uuid('chunk_id').references(() => chunks.chunkId).notNull(),
  embedding: text('embedding'), // Vector como texto (se convertirá a vector en PostgreSQL)
  embeddingsOrder: integer('embeddings_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de jerarquía legal
export const legalHierarchy = pgTable('legal_hierarchy', {
  hierarchyId: uuid('hierarchy_id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.documentId).notNull(),
  hierarchyLevel: integer('hierarchy_level').notNull(),
  hierarchyName: text('hierarchy_name').notNull(),
  legalDocumentName: text('legal_document_name').notNull(),
  legalDocumentShortName: text('legal_document_short_name'),
  legalDocumentCode: text('legal_document_code'),
  parentHierarchyId: uuid('parent_hierarchy_id'),
  jurisdiction: text('jurisdiction'),
  effectiveDate: date('effective_date'),
  isActive: boolean('is_active').default(true),
  userSelectedType: text('user_selected_type'),
  iaSuggestedType: text('ia_suggested_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de historial de chat
export const chatHistory = pgTable('chat_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  query: text('query').notNull(),
  response: text('response').notNull(),
  documentsUsed: jsonb('documents_used'), // Array de UUIDs
  sessionId: text('session_id').default('default-session'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de configuración
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relaciones
export const documentsRelations = relations(documents, ({ many }) => ({
  sections: many(sections),
  legalHierarchy: many(legalHierarchy),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  document: one(documents, {
    fields: [sections.documentId],
    references: [documents.documentId],
  }),
  parentSection: one(sections, {
    fields: [sections.parentSectionId],
    references: [sections.sectionId],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one, many }) => ({
  section: one(sections, {
    fields: [chunks.sectionId],
    references: [sections.sectionId],
  }),
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.documentId],
  }),
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  chunk: one(chunks, {
    fields: [embeddings.chunkId],
    references: [chunks.chunkId],
  }),
}));

export const legalHierarchyRelations = relations(legalHierarchy, ({ one, many }) => ({
  document: one(documents, {
    fields: [legalHierarchy.documentId],
    references: [documents.documentId],
  }),
  parentHierarchy: one(legalHierarchy, {
    fields: [legalHierarchy.parentHierarchyId],
    references: [legalHierarchy.hierarchyId],
  }),
}));

// Tipos para TypeScript
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;
export type LegalHierarchy = typeof legalHierarchy.$inferSelect;
export type NewLegalHierarchy = typeof legalHierarchy.$inferInsert;
export type ChatHistory = typeof chatHistory.$inferSelect;
export type NewChatHistory = typeof chatHistory.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert; 