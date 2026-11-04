CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"img_url" text,
	"user_id" uuid NOT NULL,
	"iso" char(2) NOT NULL,
	CONSTRAINT "collections_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "collections_iso_check" CHECK ("collections"."iso" ~ '^[a-z]{2}$')
);

ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "collections_user_id_iso_idx" ON "collections" USING btree ("user_id","iso");