CREATE TABLE IF NOT EXISTS financial_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  document_type TEXT NOT NULL DEFAULT 'outro',
  document_number TEXT,
  series TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE financial_entries
  ADD COLUMN IF NOT EXISTS issuer_id UUID REFERENCES clients(id),
  ADD COLUMN IF NOT EXISTS nf_series TEXT,
  ADD COLUMN IF NOT EXISTS is_storno BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS storno_reason TEXT,
  ADD COLUMN IF NOT EXISTS original_payment_id UUID REFERENCES financial_entries(id),
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS financial_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embarcacao_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
  os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  previous_value NUMERIC(12,2) DEFAULT 0,
  new_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_value NUMERIC(12,2) DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  triggered_by UUID REFERENCES users(id),
  triggered_by_name TEXT,
  entry_id UUID REFERENCES financial_entries(id),
  observation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_entries_nf_unique
  ON financial_entries(issuer_id, nota_fiscal_numero, nf_series)
  WHERE nota_fiscal_numero IS NOT NULL AND issuer_id IS NOT NULL;
