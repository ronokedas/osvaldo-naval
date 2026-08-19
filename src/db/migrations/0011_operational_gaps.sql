ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "embarcacoes_ids" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "tecnico_responsavel_id" uuid REFERENCES "users"("id");
