ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "theme_preference" text NOT NULL DEFAULT 'classic';
