const nullableTextSchema = {
	anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
} as const;

const pageResponseSchema = {
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

const languageParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["iso"],
	properties: { iso: { type: "string", pattern: "^[a-z]{2}$" } },
} as const;

export const getPageSchema = {
	params: {
		...languageParamsSchema,
		required: ["iso", "id"],
		properties: {
			...languageParamsSchema.properties,
			id: { type: "string", format: "uuid" },
		},
	},
	response: { 200: pageResponseSchema },
} as const;

export const getLatestPageSchema = {
	params: languageParamsSchema,
	response: { 200: pageResponseSchema },
} as const;

export const listCollectionPagesSchema = {
	params: {
		...languageParamsSchema,
		required: ["iso", "collectionId"],
		properties: {
			...languageParamsSchema.properties,
			collectionId: { type: "string", format: "uuid" },
		},
	},
	response: { 200: { type: "array", items: pageResponseSchema } },
} as const;

export interface LanguageParams {
	iso: string;
}

export interface PageParams extends LanguageParams {
	id: string;
}

export interface CollectionPagesParams extends LanguageParams {
	collectionId: string;
}
