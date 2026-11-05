CREATE TABLE "entry_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entry_encounters_entry_id_page_id_unique" UNIQUE("entry_id","page_id"),
	CONSTRAINT "entry_encounters_count_check" CHECK ("entry_encounters"."count" > 0)
);

ALTER TABLE "entry_encounters" ADD CONSTRAINT "entry_encounters_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "entry_encounters" ADD CONSTRAINT "entry_encounters_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "entry_encounters_page_id_entry_id_idx" ON "entry_encounters" USING btree ("page_id","entry_id");