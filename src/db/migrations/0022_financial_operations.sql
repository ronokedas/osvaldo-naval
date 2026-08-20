CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  natureza TEXT NOT NULL DEFAULT 'despesa',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES financial_suppliers(id),
  categoria_id UUID REFERENCES financial_categories(id),
  embarcacao_id UUID REFERENCES vessels(id),
  descricao TEXT NOT NULL,
  valor_original NUMERIC(12,2) DEFAULT 0,
  vencimento TEXT,
  competencia TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES accounts_payable(id);
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES financial_categories(id);
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES financial_suppliers(id);
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS natureza TEXT NOT NULL DEFAULT 'entrada';
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS competencia TEXT;
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS vencimento TEXT;

INSERT INTO financial_categories (nome, natureza) VALUES
  ('Administrativo', 'despesa'), ('Pessoal', 'despesa'), ('Taxas e impostos', 'despesa'),
  ('Certificadora', 'despesa'), ('Viagem e deslocamento', 'despesa'),
  ('Materiais', 'despesa'), ('Outros', 'despesa')
ON CONFLICT (nome) DO NOTHING;

UPDATE financial_entries SET natureza = CASE WHEN tipo = 'despesa' THEN 'saida' ELSE 'entrada' END
WHERE natureza IS NULL OR natureza = 'entrada' AND tipo = 'despesa';

-- Registros legados de despesas passam a ser saídas; os demais continuam entradas.
CREATE INDEX IF NOT EXISTS idx_financial_entries_natureza ON financial_entries(natureza);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
