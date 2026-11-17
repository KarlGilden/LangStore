import type { FromSchema } from "json-schema-to-ts";
import {
	commonErrorResponses,
	languageParamsSchema,
	resourceParamsSchema,
} from "./common.schema.js";

export const translationResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "text", "createdAt"],
	properties: {
		id: { type: "string", format: "uuid" },
		text: { type: "string", minLength: 1 },
		createdAt: { type: "string", format: "date-time" },
	},
} as const;

export const entryResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "text", "createdAt", "translations"],
	properties: {
		id: { type: "string", format: "uuid" },
		text: { type: "string", minLength: 1 },
		createdAt: { type: "string", format: "date-time" },
		translations: { type: "array", items: translationResponseSchema },
	},
} as const;

export const listEntriesSchema = {
	params: languageParamsSchema,
	response: {
		200: { type: "array", items: entryResponseSchema },
		...commonErrorResponses,
	},
} as const;

export const getEntrySchema = {
	params: resourceParamsSchema,
	response: { 200: entryResponseSchema, ...commonErrorResponses },
} as const;

export const createEntrySchema = {
	params: languageParamsSchema,
	body: {
		type: "object",
		additionalProperties: false,
		required: ["text"],
		properties: {
			text: { type: "string", minLength: 1 },
			translations: {
				type: "array",
				items: {
					type: "object",
					additionalProperties: false,
					required: ["text"],
					properties: { text: { type: "string", minLength: 1 } },
				},
			},
		},
	},
	response: { 201: entryResponseSchema, ...commonErrorResponses },
} as const;

export type TranslationViewModel = FromSchema<typeof translationResponseSchema>;
export type EntryViewModel = FromSchema<typeof entryResponseSchema>;
