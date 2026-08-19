ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "data_agendada" text;
ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "horario_agendado" text;
ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "local_agendado" text;
ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "contato_agendamento" text;
ALTER TABLE "service_order_items" ADD COLUMN IF NOT EXISTS "observacoes_agendamento" text;

WITH latest_schedule AS (
	SELECT DISTINCT ON (s."os_id")
		s."os_id", s."data", s."horario", s."local", s."contato", s."observacoes"
	FROM "schedules" s
	WHERE s."status" = 'agendado'
	ORDER BY s."os_id", s."updated_at" DESC
)
UPDATE "service_order_items" AS item
SET
	"data_agendada" = schedule."data",
	"horario_agendado" = schedule."horario",
	"local_agendado" = schedule."local",
	"contato_agendamento" = schedule."contato",
	"observacoes_agendamento" = schedule."observacoes"
FROM latest_schedule AS schedule
WHERE schedule."os_id" = item."os_id" AND item."data_agendada" IS NULL;
