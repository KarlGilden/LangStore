const nullableTextSchema = {
	anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
} as const;

const collectionResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "name", "description", "imgUrl", "iso"],
	properties: {
		id: { type: "string", format: "uuid" },
		name: { type: "string", minLength: 1 },
		description: nullableTextSchema,
		imgUrl: nullableTextSchema,
		iso: { type: "string", pattern: "^[a-z]{2}$" },
	},
} as const;

const languageParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["iso"],
	properties: {
		iso: { type: "string", pattern: "^[a-z]{2}$" },
	},
} as const;

const collectionParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["iso", "id"],
	properties: {
		iso: { type: "string", pattern: "^[a-z]{2}$" },
		id: { type: "string", format: "uuid" },
	},
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
	response: { 201: collectionResponseSchema },
} as const;

export const getCollectionSchema = {
	params: collectionParamsSchema,
	response: { 200: collectionResponseSchema },
} as const;

export const updateCollectionSchema = {
	params: getCollectionSchema.params,
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
	response: { 200: collectionResponseSchema },
} as const;

export const listCollectionsSchema = {
	params: languageParamsSchema,
	response: {
		200: { type: "array", items: collectionResponseSchema },
	},
} as const;

export interface CreateCollectionBody {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
}

export interface LanguageParams {
	iso: string;
}

export interface CollectionParams extends LanguageParams {
	id: string;
}

export interface UpdateCollectionBody {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
}
