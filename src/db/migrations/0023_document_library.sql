CREATE TABLE IF NOT EXISTS "document_library_folders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_id" uuid REFERENCES "document_library_folders"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "document_library_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "folder_id" uuid REFERENCES "document_library_folders"("id") ON DELETE CASCADE,
  "original_name" text NOT NULL,
  "stored_name" text NOT NULL,
  "mime_type" text,
  "size" integer DEFAULT 0 NOT NULL,
  "uploaded_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "uploaded_at" timestamp DEFAULT now() NOT NULL,
  "trashed_at" timestamp,
  "trashed_by_id" uuid REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "document_library_audit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "file_id" uuid,
  "folder_id" uuid,
  "actor_id" uuid NOT NULL REFERENCES "users"("id"),
  "action" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "document_library_files_uploaded_idx" ON "document_library_files" ("uploaded_at" DESC);
CREATE INDEX IF NOT EXISTS "document_library_files_owner_idx" ON "document_library_files" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "document_library_folders_owner_idx" ON "document_library_folders" ("owner_user_id");
