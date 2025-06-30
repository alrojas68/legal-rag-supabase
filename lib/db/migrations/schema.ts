import { pgTable, foreignKey, uuid, text, timestamp, date, index, vector, integer, check, varchar, boolean, numeric, pgView, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const sections = pgTable("sections", {
	sectionId: uuid("section_id").primaryKey().notNull(),
	documentId: uuid("document_id"),
	parentSectionId: uuid("parent_section_id"),
	sectionType: text("section_type").notNull(),
	sectionNumber: text("section_number").notNull(),
	contentHash: text("content_hash"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.documentId],
			name: "sections_document_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentSectionId],
			foreignColumns: [table.sectionId],
			name: "sections_parent_section_id_fkey"
		}).onDelete("set null"),
]);

export const documents = pgTable("documents", {
	documentId: uuid("document_id").primaryKey().notNull(),
	source: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	publicationDate: date("publication_date"),
	lastReformDate: date("last_reform_date"),
	jurisdiction: text(),
	docType: text("doc_type"),
});

export const embeddings = pgTable("embeddings", {
	vectorId: uuid("vector_id").primaryKey().notNull(),
	chunkId: uuid("chunk_id"),
	embedding: vector({ dimensions: 768 }),
	embeddingsOrder: integer("embeddings_order"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("embeddings_hnsw_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	foreignKey({
			columns: [table.chunkId],
			foreignColumns: [chunks.chunkId],
			name: "embeddings_chunk_id_fkey"
		}).onDelete("cascade"),
]);

export const legalHierarchy = pgTable("legal_hierarchy", {
	hierarchyId: uuid("hierarchy_id").defaultRandom().primaryKey().notNull(),
	documentId: uuid("document_id"),
	hierarchyLevel: integer("hierarchy_level").notNull(),
	hierarchyName: varchar("hierarchy_name", { length: 500 }).notNull(),
	legalDocumentName: varchar("legal_document_name", { length: 500 }).notNull(),
	legalDocumentShortName: varchar("legal_document_short_name", { length: 100 }),
	legalDocumentCode: varchar("legal_document_code", { length: 50 }),
	parentHierarchyId: uuid("parent_hierarchy_id"),
	jurisdiction: varchar({ length: 100 }),
	effectiveDate: date("effective_date"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	documentType: varchar("document_type", { length: 100 }),
	userSelectedType: varchar("user_selected_type", { length: 100 }),
	iaSuggestedType: varchar("ia_suggested_type", { length: 100 }),
}, (table) => [
	index("idx_legal_hierarchy_code").using("btree", table.legalDocumentCode.asc().nullsLast().op("text_ops")),
	index("idx_legal_hierarchy_document").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_legal_hierarchy_document_type").using("btree", table.documentType.asc().nullsLast().op("text_ops")),
	index("idx_legal_hierarchy_ia_suggested_type").using("btree", table.iaSuggestedType.asc().nullsLast().op("text_ops")),
	index("idx_legal_hierarchy_jurisdiction").using("btree", table.jurisdiction.asc().nullsLast().op("text_ops")),
	index("idx_legal_hierarchy_level").using("btree", table.hierarchyLevel.asc().nullsLast().op("int4_ops")),
	index("idx_legal_hierarchy_name").using("btree", table.legalDocumentName.asc().nullsLast().op("text_ops")),
	index("idx_legal_hierarchy_user_selected_type").using("btree", table.userSelectedType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.documentId],
			name: "legal_hierarchy_document_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentHierarchyId],
			foreignColumns: [table.hierarchyId],
			name: "legal_hierarchy_parent_hierarchy_id_fkey"
		}),
	check("legal_hierarchy_hierarchy_level_check", sql`(hierarchy_level >= 1) AND (hierarchy_level <= 7)`),
	check("legal_hierarchy_jurisdiction_check", sql`(jurisdiction)::text = ANY ((ARRAY['Federal'::character varying, 'Estatal'::character varying, 'Municipal'::character varying, 'Internacional'::character varying])::text[])`),
	check("legal_hierarchy_document_type_check", sql`(document_type)::text = ANY ((ARRAY['Constitución'::character varying, 'Tratado Internacional'::character varying, 'Ley Federal'::character varying, 'Constitución Local'::character varying, 'Ley Estatal'::character varying, 'Reglamento'::character varying, 'Norma Oficial Mexicana'::character varying, 'Decretos, Acuerdos y Circular Administrativa'::character varying, 'Jurisprudencia'::character varying, 'Acto Jurídico'::character varying, 'Norma Consuetudinaria'::character varying])::text[])`),
]);

export const chunks = pgTable("chunks", {
	chunkId: uuid("chunk_id").primaryKey().notNull(),
	documentId: uuid("document_id"),
	sectionId: uuid("section_id"),
	chunkText: text("chunk_text").notNull(),
	charCount: integer("char_count").notNull(),
	startPage: integer("start_page"),
	endPage: integer("end_page"),
	vectorId: uuid("vector_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
	hierarchyId: uuid("hierarchy_id"),
	legalDocumentName: varchar("legal_document_name", { length: 500 }),
	legalDocumentCode: varchar("legal_document_code", { length: 50 }),
	articleNumber: varchar("article_number", { length: 50 }),
	sectionNumber: varchar("section_number", { length: 50 }),
	paragraphNumber: varchar("paragraph_number", { length: 50 }),
	chunkOrder: integer("chunk_order"),
	// TODO: failed to parse database type 'tsvector'
	chunkTextTsv: unknown("chunk_text_tsv"),
}, (table) => [
	index("chunks_text_search_idx").using("gin", sql`to_tsvector('spanish'::regconfig, chunk_text)`),
	index("idx_chunks_article").using("btree", table.articleNumber.asc().nullsLast().op("text_ops")),
	index("idx_chunks_document_code").using("btree", table.legalDocumentCode.asc().nullsLast().op("text_ops")),
	index("idx_chunks_document_name").using("btree", table.legalDocumentName.asc().nullsLast().op("text_ops")),
	index("idx_chunks_hierarchy").using("btree", table.hierarchyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.sectionId],
			name: "chunks_section_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.hierarchyId],
			foreignColumns: [legalHierarchy.hierarchyId],
			name: "chunks_hierarchy_id_fkey"
		}).onDelete("cascade"),
]);

export const hierarchyLevels = pgTable("hierarchy_levels", {
	levelId: integer("level_id").primaryKey().notNull(),
	levelName: varchar("level_name", { length: 100 }).notNull(),
	levelDescription: text("level_description"),
	priorityWeight: numeric("priority_weight", { precision: 3, scale:  2 }).default('1.00'),
});

export const documentTypeHierarchy = pgTable("document_type_hierarchy", {
	documentType: varchar("document_type", { length: 100 }).primaryKey().notNull(),
	hierarchyLevel: integer("hierarchy_level").notNull(),
	description: text(),
	examples: text(),
	priorityWeight: numeric("priority_weight", { precision: 3, scale:  2 }).default('1.00'),
});
export const legalDocumentsHierarchy = pgView("legal_documents_hierarchy", {	documentId: uuid("document_id"),
	source: text(),
	documentCreated: timestamp("document_created", { withTimezone: true, mode: 'string' }),
	hierarchyId: uuid("hierarchy_id"),
	hierarchyLevel: integer("hierarchy_level"),
	levelName: varchar("level_name", { length: 100 }),
	priorityWeight: numeric("priority_weight", { precision: 3, scale:  2 }),
	legalDocumentName: varchar("legal_document_name", { length: 500 }),
	legalDocumentShortName: varchar("legal_document_short_name", { length: 100 }),
	legalDocumentCode: varchar("legal_document_code", { length: 50 }),
	documentType: varchar("document_type", { length: 100 }),
	documentTypeDescription: text("document_type_description"),
	documentTypeExamples: text("document_type_examples"),
	jurisdiction: varchar({ length: 100 }),
	effectiveDate: date("effective_date"),
	isActive: boolean("is_active"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalChunks: bigint("total_chunks", { mode: "number" }),
}).as(sql`SELECT d.document_id, d.source, d.created_at AS document_created, lh.hierarchy_id, lh.hierarchy_level, hl.level_name, hl.priority_weight, lh.legal_document_name, lh.legal_document_short_name, lh.legal_document_code, lh.document_type, dth.description AS document_type_description, dth.examples AS document_type_examples, lh.jurisdiction, lh.effective_date, lh.is_active, count(c.chunk_id) AS total_chunks FROM documents d LEFT JOIN legal_hierarchy lh ON d.document_id = lh.document_id LEFT JOIN hierarchy_levels hl ON lh.hierarchy_level = hl.level_id LEFT JOIN document_type_hierarchy dth ON lh.document_type::text = dth.document_type::text LEFT JOIN chunks c ON lh.hierarchy_id = c.hierarchy_id GROUP BY d.document_id, d.source, d.created_at, lh.hierarchy_id, lh.hierarchy_level, hl.level_name, hl.priority_weight, lh.legal_document_name, lh.legal_document_short_name, lh.legal_document_code, lh.document_type, dth.description, dth.examples, lh.jurisdiction, lh.effective_date, lh.is_active`);