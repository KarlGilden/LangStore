import type { FromSchema } from "json-schema-to-ts";
import {
	commonErrorResponses,
	createParamSchema,
	languageParamsSchema,
	resourceParamsSchema,
} from "./common.schema.js";

export const MAX_PAGE_ENTRY_SELECTIONS = 500;
export const MAX_PAGE_ENTRY_TEXT_LENGTH = 256;
export const MAX_PAGE_ENTRY_TRANSLATIONS = 20;
export const MAX_PAGE_ENTRY_TRANSLATION_LENGTH = 1_000;

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

export const entryReviewResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: [
		...entryResponseSchema.required,
		"encounterCount",
		"encounterPageCount",
	],
	properties: {
		...entryResponseSchema.properties,
		encounterCount: { type: "integer", minimum: 0 },
		encounterPageCount: { type: "integer", minimum: 0 },
	},
} as const;

export const listEntriesSchema = {
	params: languageParamsSchema,
	response: {
		200: { type: "array", items: entryReviewResponseSchema },
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

export const updateEntryTranslationsSchema = {
	params: createParamSchema(languageParamsSchema, resourceParamsSchema),
	body: {
		type: "object",
		additionalProperties: false,
		required: ["translations"],
		properties: {
			translations: {
				type: "array",
				maxItems: MAX_PAGE_ENTRY_TRANSLATIONS,
				items: {
					type: "object",
					additionalProperties: false,
					required: ["text"],
					properties: {
						text: {
							type: "string",
							minLength: 1,
							maxLength: MAX_PAGE_ENTRY_TRANSLATION_LENGTH,
						},
					},
				},
			},
		},
	},
	response: { 200: entryResponseSchema, ...commonErrorResponses },
} as const;

export const savePageEntriesSchema = {
	params: createParamSchema(languageParamsSchema, resourceParamsSchema),
	body: {
		type: "object",
		additionalProperties: false,
		required: ["entries"],
		properties: {
			entries: {
				type: "array",
				maxItems: MAX_PAGE_ENTRY_SELECTIONS,
				items: {
					type: "object",
					additionalProperties: false,
					required: ["text", "count"],
					properties: {
						text: {
							type: "string",
							minLength: 1,
							maxLength: MAX_PAGE_ENTRY_TEXT_LENGTH,
						},
						count: { type: "integer", minimum: 1 },
						translations: {
							type: "array",
							maxItems: MAX_PAGE_ENTRY_TRANSLATIONS,
							items: {
								type: "object",
								additionalProperties: false,
								required: ["text"],
								properties: {
									text: {
										type: "string",
										maxLength: MAX_PAGE_ENTRY_TRANSLATION_LENGTH,
									},
								},
							},
						},
					},
				},
			},
		},
	},
	response: {
		200: { type: "array", items: entryResponseSchema },
		...commonErrorResponses,
	},
} as const;

export type TranslationViewModel = FromSchema<typeof translationResponseSchema>;
export type EntryViewModel = FromSchema<typeof entryResponseSchema>;
export type EntryReviewViewModel = FromSchema<
	typeof entryReviewResponseSchema
>;
export type UpdateEntryTranslationsInput = FromSchema<
	typeof updateEntryTranslationsSchema.body
>;
