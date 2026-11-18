import type { FromSchema } from "json-schema-to-ts";
import {
	commonErrorResponses,
	createParamSchema,
	languageParamsSchema,
	nullableTextSchema,
	resourceParamsSchema,
} from "./common.schema.js";
import { entryResponseSchema } from "./entry.schema.js";

const isoAndIdParams = createParamSchema(
	languageParamsSchema,
	resourceParamsSchema,
);

export const pageResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: [
		"id",
		"collectionId",
		"name",
		"description",
		"summary",
		"createdAt",
	],
	properties: {
		id: { type: "string", format: "uuid" },
		collectionId: { type: "string", format: "uuid" },
		name: { type: "string", minLength: 1 },
		description: nullableTextSchema,
		summary: nullableTextSchema,
		createdAt: { type: "string", format: "date-time" },
	},
} as const;

export const pageVocabularyResponseSchema = {
	...entryResponseSchema,
	required: [...entryResponseSchema.required, "count"],
	properties: {
		...entryResponseSchema.properties,
		count: { type: "integer", minimum: 1 },
	},
} as const;

export const pageSuggestionResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["text", "count", "translation"],
	properties: {
		text: { type: "string", minLength: 1 },
		count: { type: "integer", minimum: 1 },
		translation: { type: "string" },
	},
} as const;

export const pageIngestionResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["page", "suggestions"],
	properties: {
		page: pageResponseSchema,
		suggestions: {
			type: "array",
			items: pageSuggestionResponseSchema,
		},
	},
} as const;

export const getPageSchema = {
	params: isoAndIdParams,
	response: { 200: pageResponseSchema, ...commonErrorResponses },
} as const;

export const getLatestPageSchema = {
	params: languageParamsSchema,
	response: { 200: pageResponseSchema, ...commonErrorResponses },
} as const;

export const listCollectionPagesSchema = {
	params: createParamSchema(languageParamsSchema, {
		collectionId: { type: "string", format: "uuid" },
	}),
	response: {
		200: { type: "array", items: pageResponseSchema },
		...commonErrorResponses,
	},
} as const;

export const createPageSchema = {
	params: createParamSchema(languageParamsSchema, {
		collectionId: { type: "string", format: "uuid" },
	}),
	body: {
		type: "object",
		additionalProperties: false,
		required: ["id", "name"],
		properties: {
			id: { type: "string", format: "uuid" },
			name: { type: "string", minLength: 1 },
			description: nullableTextSchema,
		},
	},
	response: { 201: pageResponseSchema, ...commonErrorResponses },
} as const;

export const getPageVocabularySchema = {
	params: isoAndIdParams,
	response: {
		200: {
			type: "array",
			items: pageVocabularyResponseSchema,
		},
		...commonErrorResponses,
	},
} as const;

export const createPageIngestionSchema = {
	params: createParamSchema(languageParamsSchema, {
		collectionId: { type: "string", format: "uuid" },
	}),
	response: {
		201: pageIngestionResponseSchema,
		...commonErrorResponses,
	},
} as const;

export type PageViewModel = FromSchema<typeof pageResponseSchema>;
export type PageVocabularyEntryViewModel = FromSchema<
	typeof pageVocabularyResponseSchema
>;
export type PageSuggestionViewModel = FromSchema<
	typeof pageSuggestionResponseSchema
>;
export type PageIngestionViewModel = FromSchema<
	typeof pageIngestionResponseSchema
>;
