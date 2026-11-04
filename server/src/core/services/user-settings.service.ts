import {
	InvalidLanguageCodeError,
	SettingsNotFoundError,
} from "../errors/user-settings.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { UserSettingsRepository } from "../repositories/user-settings.repository.js";
import type { UserService } from "./user.service.js";

export const createUserSettingsService = (
	userSettingsRepository: UserSettingsRepository,
	userService: UserService,
) => {
	const getSettingsForUser = async (userId: string) => {
		const settings = await userSettingsRepository.findByUserId(userId);

		if (!settings) {
			throw new SettingsNotFoundError();
		}

		return settings;
	};

	const getSettings = async (providerId: string) => {
		const user = await userService.getOrCreateUser(providerId);
		return getSettingsForUser(user.id);
	};

	const replaceSettings = async (
		providerId: string,
		input: { targetLanguage: string; userLanguage: string },
	) => {
		if (!isAssignedIso6391Code(input.targetLanguage)) {
			throw new InvalidLanguageCodeError("targetLanguage");
		}
		if (!isAssignedIso6391Code(input.userLanguage)) {
			throw new InvalidLanguageCodeError("userLanguage");
		}

		const user = await userService.getOrCreateUser(providerId);
		return userSettingsRepository.upsert({ userId: user.id, ...input });
	};

	return { getSettings, getSettingsForUser, replaceSettings };
};

export type UserSettingsService = ReturnType<typeof createUserSettingsService>;
