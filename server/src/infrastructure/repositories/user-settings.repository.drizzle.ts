import { eq } from "drizzle-orm";
import type { UserSettingsRepository } from "../../core/repositories/user-settings.repository.js";
import type { Database } from "../data/db.js";
import { toDomainUserSettings } from "../data/mappers/user-settings.mapper.js";
import { userSettings } from "../data/schema.js";

export function createDrizzleUserSettingsRepository(
	db: Database,
): UserSettingsRepository {
	const findByUserId: UserSettingsRepository["findByUserId"] = async (userId) => {
		const [row] = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		return row ? toDomainUserSettings(row) : null;
	};

	const upsert: UserSettingsRepository["upsert"] = async (input) => {
		const [row] = await db
			.insert(userSettings)
			.values(input)
			.onConflictDoUpdate({
				target: userSettings.userId,
				set: {
					targetLanguage: input.targetLanguage,
					userLanguage: input.userLanguage,
				},
			})
			.returning();

		if (!row) {
			throw new Error("Failed to persist user settings");
		}

		return toDomainUserSettings(row);
	};

	return { findByUserId, upsert };
}
