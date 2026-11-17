import type { FromSchema } from "json-schema-to-ts";
import { commonErrorResponses, isoSchema } from "./common.schema.js";

export const userSettingsResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["targetLanguage", "userLanguage"],
	properties: {
		targetLanguage: isoSchema,
		userLanguage: isoSchema,
	},
} as const;

export const getUserSettingsSchema = {
	response: {
		200: userSettingsResponseSchema,
		...commonErrorResponses,
	},
} as const;

export const replaceUserSettingsSchema = {
	body: userSettingsResponseSchema,
	response: {
		200: userSettingsResponseSchema,
		...commonErrorResponses,
	},
} as const;

export type UserSettingsViewModel = FromSchema<
	typeof userSettingsResponseSchema
>;
