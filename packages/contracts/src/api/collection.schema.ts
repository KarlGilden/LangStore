import type { FromSchema } from "json-schema-to-ts";
import {
	commonErrorResponses,
	createParamSchema,
	isoSchema,
	languageParamsSchema,
	nullableTextSchema,
	resourceParamsSchema,
} from "./common.schema.js";

const isoAndIdParams = createParamSchema(
	languageParamsSchema,
	resourceParamsSchema,
);

export const collectionResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "name", "description", "imgUrl", "iso"],
	properties: {
		id: { type: "string", format: "uuid" },
		name: { type: "string", minLength: 1 },
		description: nullableTextSchema,
		imgUrl: nullableTextSchema,
		iso: isoSchema,
	},
} as const;

export const listCollectionsSchema = {
	params: languageParamsSchema,
	response: {
		200: { type: "array", items: collectionResponseSchema },
		...commonErrorResponses,
	},
} as const;

export const getCollectionSchema = {
	params: isoAndIdParams,
	response: { 200: collectionResponseSchema, ...commonErrorResponses },
} as const;

export const updateCollectionSchema = {
	params: isoAndIdParams,
	body: {
		type: "object",
		additionalProperties: false,
		required: ["name"],
		properties: {
			name: { type: "string", minLength: 1 },
			description: nullableTextSchema,
			imgUrl: nullableTextSchema,
		},
	},
	response: { 200: collectionResponseSchema, ...commonErrorResponses },
} as const;

export const deleteCollectionSchema = {
	params: isoAndIdParams,
	response: { 204: { type: "null" }, ...commonErrorResponses },
} as const;

export const createCollectionSchema = {
	params: languageParamsSchema,
	body: {
		type: "object",
		additionalProperties: false,
		required: ["name"],
		properties: {
			name: { type: "string", minLength: 1 },
			description: nullableTextSchema,
			imgUrl: nullableTextSchema,
		},
	},
	response: { 201: collectionResponseSchema, ...commonErrorResponses },
} as const;

export type CollectionViewModel = FromSchema<typeof collectionResponseSchema>;
