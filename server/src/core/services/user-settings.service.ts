import {
	InvalidLanguageCodeError,
	SettingsNotFoundError,
} from "../errors/user-settings.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { UserSettingsRepository } from "../repositories/user-settings.repository.js";
import type { UserService } from "./user.service.js";

export const createUserSettingsService = (
	userSettingsRepository: UserSettingsRepository,
) => {
	const getSettings = async (userId: string) => {
		const settings = await userSettingsRepository.get(userId);

		if (!settings) {
			throw new SettingsNotFoundError();
		}

		return settings;
	};

	const replaceSettings = async (
		userId: string,
		input: { targetLanguage: string; userLanguage: string },
	) => {
		if (!isAssignedIso6391Code(input.targetLanguage)) {
			throw new InvalidLanguageCodeError("targetLanguage");
		}
		if (!isAssignedIso6391Code(input.userLanguage)) {
			throw new InvalidLanguageCodeError("userLanguage");
		}

		return userSettingsRepository.upsert({ userId, ...input });
	};

	return { getSettings, replaceSettings };
};

export type UserSettingsService = ReturnType<typeof createUserSettingsService>;
