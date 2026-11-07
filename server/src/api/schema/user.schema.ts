import type { FromSchema } from "json-schema-to-ts";
import { commonErrorResponses, nullableTextSchema } from "./common.schema.js";

export const userResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id", "username", "email", "createdAt"],
	properties: {
		id: { type: "string", format: "uuid" },
		username: nullableTextSchema,
		email: { type: "string" },
		createdAt: { type: "string", format: "date-time" },
	},
} as const;

export const getUserSchema = {
	response: {
		200: userResponseSchema,
		...commonErrorResponses,
	},
} as const;

export type UserViewModel = FromSchema<typeof userResponseSchema>;
