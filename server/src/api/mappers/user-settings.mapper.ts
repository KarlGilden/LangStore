import type { UserSettings } from "../../core/entities/user-settings.entity.js";
import type { UserSettingsViewModel } from "@langstore/contracts";

export function toUserSettingsViewModel(
	settings: UserSettings,
): UserSettingsViewModel {
	return {
		targetLanguage: settings.targetLanguage,
		userLanguage: settings.userLanguage,
	};
}
