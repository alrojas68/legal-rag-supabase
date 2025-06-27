import { relations } from "drizzle-orm/relations";
import { documents, sections, chunks, embeddings, legalHierarchy } from "./schema";

export const sectionsRelations = relations(sections, ({one, many}) => ({
	document: one(documents, {
		fields: [sections.documentId],
		references: [documents.documentId]
	}),
	section: one(sections, {
		fields: [sections.parentSectionId],
		references: [sections.sectionId],
		relationName: "sections_parentSectionId_sections_sectionId"
	}),
	sections: many(sections, {
		relationName: "sections_parentSectionId_sections_sectionId"
	}),
	chunks: many(chunks),
}));

export const documentsRelations = relations(documents, ({many}) => ({
	sections: many(sections),
	legalHierarchies: many(legalHierarchy),
}));

export const embeddingsRelations = relations(embeddings, ({one}) => ({
	chunk: one(chunks, {
		fields: [embeddings.chunkId],
		references: [chunks.chunkId]
	}),
}));

export const chunksRelations = relations(chunks, ({one, many}) => ({
	embeddings: many(embeddings),
	section: one(sections, {
		fields: [chunks.sectionId],
		references: [sections.sectionId]
	}),
	legalHierarchy: one(legalHierarchy, {
		fields: [chunks.hierarchyId],
		references: [legalHierarchy.hierarchyId]
	}),
}));

export const legalHierarchyRelations = relations(legalHierarchy, ({one, many}) => ({
	document: one(documents, {
		fields: [legalHierarchy.documentId],
		references: [documents.documentId]
	}),
	legalHierarchy: one(legalHierarchy, {
		fields: [legalHierarchy.parentHierarchyId],
		references: [legalHierarchy.hierarchyId],
		relationName: "legalHierarchy_parentHierarchyId_legalHierarchy_hierarchyId"
	}),
	legalHierarchies: many(legalHierarchy, {
		relationName: "legalHierarchy_parentHierarchyId_legalHierarchy_hierarchyId"
	}),
	chunks: many(chunks),
}));