-- Índices para manter filtros, ordenação e paginação eficientes em bases grandes.
CREATE INDEX IF NOT EXISTS financial_entries_effective_date_idx ON financial_entries (data DESC, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS financial_entries_vessel_date_idx ON financial_entries (embarcacao_id, data DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS accounts_receivable_status_created_idx ON accounts_receivable (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS payments_receivable_active_created_idx ON payments (conta_receber_id, ativo, created_at DESC);
CREATE INDEX IF NOT EXISTS accounts_payable_status_due_idx ON accounts_payable (status, vencimento, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (nome);
CREATE INDEX IF NOT EXISTS vessels_created_idx ON vessels (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS vessels_status_created_idx ON vessels (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS proposals_created_idx ON proposals (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS service_orders_status_created_idx ON service_orders (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS protocols_status_created_idx ON protocols (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx ON notifications (usuario_id, lida, created_at DESC);
CREATE INDEX IF NOT EXISTS document_library_files_folder_uploaded_idx ON document_library_files (folder_id, uploaded_at DESC, id DESC);
