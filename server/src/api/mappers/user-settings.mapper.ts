import type { UserSettings } from "../../core/entities/user-settings.entity.js";
import type { UserSettingsViewModel } from "../viewmodels/user-settings.viewmodel.js";

export function toUserSettingsViewModel(
	settings: UserSettings,
): UserSettingsViewModel {
	return {
		targetLanguage: settings.targetLanguage,
		userLanguage: settings.userLanguage,
	};
}
