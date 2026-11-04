CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"target_language" char(2) NOT NULL,
	"user_language" char(2) NOT NULL,
	CONSTRAINT "user_settings_target_language_check" CHECK ("user_settings"."target_language" ~ '^[a-z]{2}$'),
	CONSTRAINT "user_settings_user_language_check" CHECK ("user_settings"."user_language" ~ '^[a-z]{2}$')
);

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;