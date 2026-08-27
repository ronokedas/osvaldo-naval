-- Keep every approved final file so a later supplemental file can reopen
-- delivery without replacing the document or dispatch already recorded.
DROP INDEX IF EXISTS "approved_document_file_document_unique";

CREATE INDEX IF NOT EXISTS "approved_document_files_protocol_document_idx"
  ON "approved_document_files" ("protocolo_id", "documento_id");
