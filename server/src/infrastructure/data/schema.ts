import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

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
