CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"summary" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "pages" ADD CONSTRAINT "pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages" ADD CONSTRAINT "pages_collection_id_user_id_collections_id_user_id_fk" FOREIGN KEY ("collection_id","user_id") REFERENCES "public"."collections"("id","user_id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "pages_user_id_created_at_id_idx" ON "pages" USING btree ("user_id","created_at","id");
CREATE INDEX "pages_collection_id_idx" ON "pages" USING btree ("collection_id");