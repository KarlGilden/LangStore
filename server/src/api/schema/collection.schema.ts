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

export const createCollectionSchema = {
	body: {
		type: "object",
		additionalProperties: false,
		required: ["name", "iso"],
		properties: {
			name: { type: "string", minLength: 1 },
			description: nullableTextSchema,
			imgUrl: nullableTextSchema,
			iso: { type: "string", pattern: "^[a-z]{2}$" },
		},
	},
	response: { 201: collectionResponseSchema },
} as const;

export const getCollectionSchema = {
	params: {
		type: "object",
		additionalProperties: false,
		required: ["id"],
		properties: { id: { type: "string", format: "uuid" } },
	},
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
	response: {
		200: { type: "array", items: collectionResponseSchema },
	},
} as const;

export interface CreateCollectionBody {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
	iso: string;
}

export interface CollectionParams {
	id: string;
}

export interface UpdateCollectionBody {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
}
