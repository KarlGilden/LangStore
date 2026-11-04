export const userResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "username", "email", "createdAt"],
	properties: {
		id: { type: "string", format: "uuid" },
		username: {
			anyOf: [{ type: "string" }, { type: "null" }],
		},
		email: { type: "string" },
		createdAt: { type: "string", format: "date-time" },
	},
} as const;

export const getUserSchema = {
	response: {
		200: userResponseSchema,
	},
} as const;
