CREATE TABLE IF NOT EXISTS "service_order_item_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL REFERENCES "service_order_items"("id") ON DELETE CASCADE,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id") ON DELETE CASCADE,
	"autor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"autor_nome" text NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "service_order_item_comments_item_idx"
	ON "service_order_item_comments" ("item_id", "created_at");
