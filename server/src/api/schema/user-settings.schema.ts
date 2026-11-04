const languageCodeSchema = {
	type: "string",
	pattern: "^[a-z]{2}$",
} as const;

export const userSettingsResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["targetLanguage", "userLanguage"],
	properties: {
		targetLanguage: languageCodeSchema,
		userLanguage: languageCodeSchema,
	},
} as const;

export const getUserSettingsSchema = {
	response: {
		200: userSettingsResponseSchema,
	},
} as const;

export const replaceUserSettingsSchema = {
	body: {
		type: "object",
		additionalProperties: false,
		required: ["targetLanguage", "userLanguage"],
		properties: {
			targetLanguage: languageCodeSchema,
			userLanguage: languageCodeSchema,
		},
	},
	response: {
		200: userSettingsResponseSchema,
	},
} as const;

export interface ReplaceUserSettingsBody {
	targetLanguage: string;
	userLanguage: string;
}
