-- Migration 0004: Refatoração do Módulo Financeiro
-- Data: 2025-01-07
-- Descrição: Corrige bugs críticos de validação, cálculos, uploads e notificações

-- 1. Tabela para anexos financeiros (Notas Fiscais, Recibos, Boletos)
CREATE TABLE IF NOT EXISTS financial_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    document_type TEXT NOT NULL DEFAULT 'outro', -- nf, recibo, boleto, comprovante, outro
    document_number TEXT, -- Número do documento (NF, recibo, etc)
    series TEXT, -- Série da NF
    uploaded_by UUID REFERENCES users(id),
    uploaded_by_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_attachments_transaction 
ON financial_attachments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_financial_attachments_document_type 
ON financial_attachments(document_type);

-- 2. Tabela para histórico de status financeiro
CREATE TABLE IF NOT EXISTS financial_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embarcacao_id UUID REFERENCES vessels(id) ON DELETE CASCADE,
    os_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    previous_status TEXT, -- PENDENTE, PARCIAL, PAGO
    new_status TEXT NOT NULL, -- PENDENTE, PARCIAL, PAGO
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

CREATE INDEX IF NOT EXISTS idx_financial_status_history_embarcacao 
ON financial_status_history(embarcacao_id);

CREATE INDEX IF NOT EXISTS idx_financial_status_history_os 
ON financial_status_history(os_id);

CREATE INDEX IF NOT EXISTS idx_financial_status_history_created 
ON financial_status_history(created_at DESC);

-- 3. Adicionar colunas faltantes em financial_entries
ALTER TABLE financial_entries 
ADD COLUMN IF NOT EXISTS issuer_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS nf_series TEXT,
ADD COLUMN IF NOT EXISTS is_storno BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS storno_reason TEXT,
ADD COLUMN IF NOT EXISTS original_payment_id UUID REFERENCES financial_entries(id),
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- 4. Criar índice para busca de NFs únicas por emitente
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_entries_nf_unique 
ON financial_entries(issuer_id, nota_fiscal_numero, nf_series) 
WHERE nota_fiscal_numero IS NOT NULL AND issuer_id IS NOT NULL;

-- 5. Índices de performance para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_financial_entries_os_id 
ON financial_entries(os_id) WHERE os_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_embarcacao_id 
ON financial_entries(embarcacao_id) WHERE embarcacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_date 
ON financial_entries(data DESC);

CREATE INDEX IF NOT EXISTS idx_financial_entries_tipo 
ON financial_entries(tipo);

CREATE INDEX IF NOT EXISTS idx_financial_entries_conta_receber 
ON financial_entries(conta_receber_id) WHERE conta_receber_id IS NOT NULL;

-- 6. Função para calcular status financeiro automaticamente
CREATE OR REPLACE FUNCTION calculate_financial_status()
RETURNS TRIGGER AS $$
DECLARE
    vessel_rec RECORD;
    total_recebido NUMERIC(12,2);
    total_value NUMERIC(12,2);
    percentage NUMERIC(5,2);
    new_status TEXT;
    status_changed BOOLEAN := FALSE;
    old_status TEXT;
BEGIN
    -- Determinar qual tabela atualizar baseado no trigger
    IF TG_TABLE_NAME = 'financial_entries' THEN
        IF NEW.embarcacao_id IS NOT NULL THEN
            -- Calcular total recebido para esta embarcação
            SELECT COALESCE(SUM(valor::numeric), 0)
            INTO total_recebido
            FROM financial_entries
            WHERE embarcacao_id = NEW.embarcacao_id 
              AND tipo != 'despesa'
              AND is_storno = FALSE;
            
            -- Subtrair estornos
            SELECT COALESCE(SUM(valor::numeric), 0)
            INTO total_recebido
            FROM financial_entries
            WHERE embarcacao_id = NEW.embarcacao_id 
              AND tipo != 'despesa'
              AND is_storno = TRUE;
            
            total_recebido := total_recebido - (total_recebido * 2); -- Subtract estornos
            
            -- Buscar valor total da embarcação
            SELECT valor_total::numeric INTO total_value
            FROM vessels
            WHERE id = NEW.embarcacao_id;
            
            IF total_value > 0 THEN
                percentage := (total_recebido / total_value) * 100;
            ELSE
                percentage := 0;
            END IF;
            
            -- Determinar status
            IF percentage >= 100 THEN
                new_status := 'PAGO';
            ELSIF percentage > 0 THEN
                new_status := 'PARCIAL';
            ELSE
                new_status := 'PENDENTE';
            END IF;
            
            -- Atualizar vessels
            UPDATE vessels
            SET valor_recebido = total_recebido,
                updated_at = NOW()
            WHERE id = NEW.embarcacao_id;
            
            -- Registrar histórico se status mudou
            SELECT etapa_atual INTO old_status
            FROM vessels
            WHERE id = NEW.embarcacao_id;
            
            IF old_status IS DISTINCT FROM new_status THEN
                INSERT INTO financial_status_history (
                    embarcacao_id,
                    previous_status,
                    new_status,
                    previous_value,
                    new_value,
                    total_value,
                    percentage,
                    triggered_by,
                    entry_id,
                    created_at
                ) VALUES (
                    NEW.embarcacao_id,
                    old_status,
                    new_status,
                    0,
                    total_recebido,
                    total_value,
                    percentage,
                    NULL,
                    NEW.id,
                    NOW()
                );
                
                UPDATE vessels
                SET etapa_atual = new_status
                WHERE id = NEW.embarcacao_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para atualizar status após inserção/edição de pagamento
DROP TRIGGER IF EXISTS trg_update_vessel_received ON financial_entries;
CREATE TRIGGER trg_update_vessel_received
    AFTER INSERT OR UPDATE ON financial_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_financial_status();

-- 8. Comentários nas tabelas novas
COMMENT ON TABLE financial_attachments IS 'Anexos de documentos financeiros (NFs, recibos, boletos) vinculados a transações';
COMMENT ON TABLE financial_status_history IS 'Histórico de mudanças de status financeiro para auditoria';
COMMENT ON COLUMN financial_entries.is_storno IS 'Indica se este lançamento é um estorno';
COMMENT ON COLUMN financial_entries.storno_reason IS 'Motivo do estorno (obrigatório se is_storno=true)';
COMMENT ON COLUMN financial_entries.original_payment_id IS 'Referência ao pagamento original sendo estornado';

