ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "data_impressao" text;
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "impresso_por_id" uuid REFERENCES "users"("id");
