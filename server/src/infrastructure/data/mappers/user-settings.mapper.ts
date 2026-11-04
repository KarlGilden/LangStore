import type { UserSettings } from "../../../core/entities/user-settings.entity.js";
import type { UserSettingsRow } from "../schema.js";

export function toDomainUserSettings(row: UserSettingsRow): UserSettings {
	return {
		userId: row.userId,
		targetLanguage: row.targetLanguage,
		userLanguage: row.userLanguage,
	};
}
