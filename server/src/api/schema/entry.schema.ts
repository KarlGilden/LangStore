const translationResponseSchema = {
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
	required: ["id", "text", "iso", "createdAt", "translations"],
	properties: {
		id: { type: "string", format: "uuid" },
		text: { type: "string", minLength: 1 },
		iso: { type: "string", pattern: "^[a-z]{2}$" },
		createdAt: { type: "string", format: "date-time" },
		translations: { type: "array", items: translationResponseSchema },
	},
} as const;

const entryParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id"],
	properties: { id: { type: "string", format: "uuid" } },
} as const;

export const createEntrySchema = {
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
	response: { 201: entryResponseSchema },
} as const;

export const getEntrySchema = {
	params: entryParamsSchema,
	response: { 200: entryResponseSchema },
} as const;

export const listEntriesSchema = {
	response: { 200: { type: "array", items: entryResponseSchema } },
} as const;

export interface CreateEntryBody {
	text: string;
	translations?: { text: string }[];
}

export interface EntryParams {
	id: string;
}
