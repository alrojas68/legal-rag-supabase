CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"response" text NOT NULL,
	"documents_used" jsonb,
	"session_id" text DEFAULT 'default-session',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"chunk_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"document_id" uuid,
	"chunk_text" text NOT NULL,
	"char_count" integer NOT NULL,
	"start_page" integer,
	"end_page" integer,
	"chunk_order" integer,
	"vector_id" uuid,
	"hierarchy_id" uuid,
	"legal_document_name" text,
	"legal_document_code" text,
	"article_number" text,
	"section_number" text,
	"paragraph_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"document_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"last_reform_date" date,
	"jurisdiction" text,
	"doc_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"vector_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"embedding" text,
	"embeddings_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_hierarchy" (
	"hierarchy_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"hierarchy_level" integer NOT NULL,
	"hierarchy_name" text NOT NULL,
	"legal_document_name" text NOT NULL,
	"legal_document_short_name" text,
	"legal_document_code" text,
	"parent_hierarchy_id" uuid,
	"jurisdiction" text,
	"effective_date" date,
	"is_active" boolean DEFAULT true,
	"user_selected_type" text,
	"ia_suggested_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"section_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_section_id" uuid,
	"section_type" text,
	"section_number" text,
	"content_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_chunk_id_chunks_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("chunk_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_hierarchy" ADD CONSTRAINT "legal_hierarchy_document_id_documents_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_document_id_documents_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("document_id") ON DELETE no action ON UPDATE no action;