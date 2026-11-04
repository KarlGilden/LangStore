import { sql } from "drizzle-orm";
import {
	char,
	check,
	index,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

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

export const collections = pgTable(
	"collections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description"),
		imgUrl: text("img_url"),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
				onUpdate: "no action",
			}),
		iso: char("iso", { length: 2 }).notNull(),
	},
	(table) => [
		check("collections_iso_check", sql`${table.iso} ~ '^[a-z]{2}$'`),
		unique("collections_id_user_id_unique").on(table.id, table.userId),
		index("collections_user_id_iso_idx").on(table.userId, table.iso),
	],
);

export type CollectionRow = typeof collections.$inferSelect;
export type NewCollectionRow = typeof collections.$inferInsert;
