# Documentação do Módulo Financeiro Refatorado

## 📋 Visão Geral

Esta documentação descreve as correções e melhorias implementadas no módulo financeiro do sistema "Osvaldo Naval" conforme tarefa de refatoração completa.

## 🔧 Correções Implementadas

### 1. Validação de Permissões (Security Fix) ✅

**Problema:** Usuários sem permissão financeira podiam acessar rotas de edição/exclusão de pagamentos.

**Solução:**
- Criado middleware `requireFinanceAccess` em `src/server/middleware/requireFinanceRole.ts`
- Middleware `requireAdminAccess` para operações de exclusão (apenas admin)
- Todas as rotas `/financeiro/**` agora validam permissões

**Código:**
```typescript
// Middleware valida role do usuário
const allowedRoles = ["admin", "financeiro"];
if (!allowedRoles.includes(user.role)) {
  return res.status(403).json({ error: "Acesso negado" });
}
```

### 2. Cálculos de Totais e Status (Logic Fix) ✅

**Problema:** Saldo total e status da OS não atualizavam corretamente com múltiplos recebimentos ou estornos.

**Solução:**
- Função utilitária `calculateFinancialStatus(orderId)` em `src/utils/financial-utils.ts`
- Trigger no banco `trg_update_vessel_received` atualiza automaticamente
- Tabela `financial_status_history` para auditoria de mudanças
- Estornos são subtraídos corretamente

**Status possíveis:**
- `PENDENTE`: 0% recebido
- `PARCIAL`: >0% e <100% recebido
- `PAGO`: ≥100% recebido

### 3. Upload e Vinculação de Notas Fiscais (Data Integrity) ✅

**Problema:** Arquivos perdiam vínculo com transação específica.

**Solução:**
- Nova tabela `financial_attachments` com campos:
  - `transaction_id`: UUID vinculando ao lançamento
  - `file_url`, `file_name`, `file_size`, `mime_type`
  - `document_type`: nf, recibo, boleto, comprovante, outro
  - `document_number`, `series`: Metadados do documento
  - `uploaded_by`, `uploaded_by_name`: Auditoria

**Schema:**
```typescript
export const financial_attachments = pgTable("financial_attachments", {
  id: uuid("id").primaryKey(),
  transactionId: uuid("transaction_id").notNull().references(financial_entries.id),
  documentType: text("document_type").notNull().default("outro"),
  // ... demais campos
});
```

### 4. Formatação Monetária e CSV Export (UX & Data Fix) ✅

**Problema:** Valores em CSV como string formatada quebravam planilhas.

**Solução:**
- Internamente: `DECIMAL(12,2)` rigoroso no banco
- CSV export gera DUAS colunas:
  - `Valor Bruto`: Formato ISO `1000.00` (para importação)
  - `Valor Formatado (BRL)`: Formato brasileiro `R$ 1.000,00` (leitura humana)

**Exemplo CSV:**
```csv
"ID","Data","Valor Bruto","Valor Formatado (BRL)"
"uuid","2025-01-07","1000.00","R$ 1.000,00"
```

### 5. Validação de Números Únicos de NF (Business Rule) ✅

**Problema:** Permitia duplicidade de Notas Fiscais.

**Solução:**
- Unique constraint no banco: `(issuer_id, nota_fiscal_numero, nf_series)`
- Validação `validateNfUnique()` antes do submit
- Mensagem de erro clara: "Já existe uma Nota Fiscal número X série Y..."

**Índice único:**
```sql
CREATE UNIQUE INDEX idx_financial_entries_nf_unique 
ON financial_entries(issuer_id, nota_fiscal_numero, nf_series) 
WHERE nota_fiscal_numero IS NOT NULL AND issuer_id IS NOT NULL;
```

### 6. Notificações Financeiras (Communication Fix) ✅

**Problema:** Interessados não eram notificados sobre pagamentos/NFs.

**Solução:**
- Função `notifyFinancialUpdate()` dispara notificações para:
  - Admin/Financeiro: "Novo pagamento recebido"
  - Todos usuários ativos com role admin/financeiro
- Tipos de evento: `PAYMENT_RECEIVED`, `NF_ATTACHED`, `STORNO`, `STATUS_CHANGED`
- Tabela `notifications` registra com tipo `FINANCE_UPDATE`

### 7. Tratamento de Erros e Feedback Visual ✅

**Problema:** Falhas silenciosas ou erros genéricos.

**Solução:**
- Try/catch robusto em todas as rotas
- Mensagens específicas por erro:
  - `23505` (unique violation): "Nota Fiscal duplicada"
  - `404`: "Lançamento não encontrado"
  - `400`: "Valor inválido", "Motivo obrigatório"
- Logs de erro no console para debugging

## 📁 Estrutura de Arquivos

```
src/
├── db/
│   ├── migrations/
│   │   └── 0004_financial_refactor.sql  # NOVO: Migration completa
│   └── schema.ts                         # ATUALIZADO: Novas tabelas
├── server/
│   ├── middleware/
│   │   └── requireFinanceRole.ts         # NOVO: Middlewares de permissão
│   └── routes/
│       └── finance.ts                    # REVISADO: Rotas completas
└── utils/
    └── financial-utils.ts                # NOVO: Utilitários financeiros
```

## 🗄️ Schema do Banco

### Novas Tabelas

#### `financial_attachments`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| transaction_id | UUID | FK para financial_entries |
| file_url | TEXT | URL do arquivo |
| document_type | TEXT | nf, recibo, boleto, etc |
| document_number | TEXT | Número do documento |
| series | TEXT | Série da NF |

#### `financial_status_history`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| embarcacao_id | UUID | FK para vessels |
| previous_status | TEXT | Status anterior |
| new_status | TEXT | Novo status (PENDENTE/PARCIAL/PAGO) |
| percentage | DECIMAL | Percentual pago |

### Colunas Adicionadas em `financial_entries`
- `nf_series`: Série da Nota Fiscal
- `issuer_id`: Emitente da NF (FK clients)
- `is_storno`: Boolean indicando estorno
- `storno_reason`: Motivo do estorno
- `original_payment_id`: FK para pagamento original
- `notification_sent`: Se notificação foi enviada

## 🔌 Endpoints da API

### GET `/financeiro`
Lista lançamentos com filtros opcionais.

**Query params:**
- `embarcacaoId`: Filtrar por embarcação
- `osId`: Filtrar por OS
- `tipo`: Filtrar por tipo (sinal, parcela, etc)
- `dataInicio`, `dataFim`: Range de datas
- `search`: Busca texto livre

### GET `/financeiro/export/csv`
Exporta CSV com valores brutos e formatados.

### POST `/financeiro`
Cria novo lançamento.

**Body:**
```json
{
  "embarcacaoId": "uuid",
  "valor": 1000.00,
  "tipo": "parcela",
  "notaFiscalNumero": "123456",
  "nfSeries": "1",
  "issuerId": "uuid",
  "isStorno": false,
  "anexos": [...]
}
```

**Validações:**
- Valor monetário válido
- NF única por emitente/série
- Motivo obrigatório se estorno

### PUT `/financeiro/:id`
Atualiza lançamento existente.

### DELETE `/financeiro/:id`
**Apenas admin.** Exclui lançamento e anexos.

### GET `/financeiro/status/:id`
Calcula status financeiro (PENDENTE/PARCIAL/PAGO).

**Query params:**
- `type`: "os" ou "embarcacao" (default: embarcacao)

## 🧪 Cenários de Teste

### 1. Pagamento Parcial + Complemento
```
1. Criar lançamento de R$ 5.000,00 (tipo: sinal)
   → Status: PARCIAL (50%)
2. Criar lançamento de R$ 5.000,00 (tipo: parcela)
   → Status: PAGO (100%)
```

### 2. Estorno Total
```
1. Criar pagamento de R$ 1.000,00
2. Criar estorno de R$ 1.000,00 vinculando ao original
   → Status volta para PENDENTE
   → Notificação "Estorno registrado" disparada
```

### 3. Duplicidade de NF
```
1. Cadastrar NF 123456 série 1 para cliente X
2. Tentar cadastrar mesma NF para cliente X
   → Erro 409: "Nota Fiscal duplicada"
```

### 4. Acesso Negado
```
1. Login como usuário "tecnico"
2. Tentar POST /financeiro
   → Erro 403: "Acesso negado"
3. Login como "financeiro"
2. Tentar DELETE /financeiro/:id
   → Erro 403: "Apenas administradores podem excluir"
```

## 🚀 Migração

Execute a migration antes de usar:

```bash
psql -U usuario -d nome_database -f src/db/migrations/0004_financial_refactor.sql
```

Ou via Drizzle (se configurado):
```bash
npx drizzle-kit migrate
```

## ✅ Checklist de Validação

- [ ] Middleware de permissão aplicado em todas as rotas
- [ ] Trigger de atualização automática funcionando
- [ ] Validação de NF única ativa
- [ ] CSV exporta colunas bruta e formatada
- [ ] Notificações são disparadas
- [ ] Estornos subtraem corretamente
- [ ] Histórico é registrado em `financial_status_history`
- [ ] Anexos vinculados corretamente
- [ ] Apenas admin exclui lançamentos
- [ ] Mensagens de erro amigáveis

## 📝 Regras de Negócio

1. **Permissões:**
   - `admin`: CRUD completo
   - `financeiro`: Create, Read, Update (sem Delete)
   - `tecnico`/outros: Nenhum acesso

2. **Notas Fiscais:**
   - Únicas por `(emitente, número, série)`
   - Série opcional mas recomendada

3. **Estornos:**
   - Requer motivo obrigatório
   - Vincula ao pagamento original
   - Dispara notificação de alta prioridade

4. **Status:**
   - Atualizado automaticamente via trigger
   - Registrado em histórico para auditoria

---

**Data da implementação:** 2025-01-07  
**Versão:** 1.0.0  
**Responsável:** Refatoração Módulo Financeiro
