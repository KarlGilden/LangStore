ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "users" ADD COLUMN "username" text;
UPDATE "users" SET "email" = lower(btrim("email"));
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
