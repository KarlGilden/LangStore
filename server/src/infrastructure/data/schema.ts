import { sql } from "drizzle-orm";
import { char, check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),

	providerId: text("provider_id").notNull().unique(),

	username: text("username"),

	email: text("email").notNull().unique(),

	createdAt: timestamp("created_at", {
		withTimezone: true,
		precision: 3,
	})
		.notNull()
		.defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export const userSettings = pgTable(
	"user_settings",
	{
		userId: uuid("user_id")
			.primaryKey()
			.references(() => users.id, {
				onDelete: "cascade",
				onUpdate: "no action",
			}),
		targetLanguage: char("target_language", { length: 2 }).notNull(),
		userLanguage: char("user_language", { length: 2 }).notNull(),
	},
	(table) => [
		check(
			"user_settings_target_language_check",
			sql`${table.targetLanguage} ~ '^[a-z]{2}$'`,
		),
		check(
			"user_settings_user_language_check",
			sql`${table.userLanguage} ~ '^[a-z]{2}$'`,
		),
	],
);

export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;
