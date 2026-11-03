export const userResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["email"],
	properties: {
		email: { type: "string" },
	},
} as const;

export const getUserSchema = {
	response: {
		200: userResponseSchema,
	},
} as const;
