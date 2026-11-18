import type { JSONSchema } from "json-schema-to-ts";

export const isoSchema = {
	type: "string",
	pattern: "^[a-z]{2}$",
} as const;

export const languageParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["iso"],
	properties: {
		iso: isoSchema,
	},
} as const;

export const resourceParamsSchema = {
	type: "object",
	additionalProperties: false,
	required: ["id"],
	properties: {
		id: { type: "string", format: "uuid" },
	},
} as const;

export const nullableTextSchema = {
	anyOf: [{ type: "string", minLength: 1 }, { type: "null" }],
} as const;

export const errorResponseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["error"],
	properties: {
		error: { type: "string" },
	},
} as const;

export const commonErrorResponses = {
	400: errorResponseSchema,
	401: errorResponseSchema,
	500: errorResponseSchema,
} as const;

type Properties = Readonly<Record<string, JSONSchema>>;

type ParamSchema = {
	readonly type: "object";
	readonly additionalProperties: false;
	readonly properties: Properties;
	readonly required: readonly string[];
};

type ParamInput = ParamSchema | Properties;

type PropertiesOf<T> = T extends ParamSchema ? T["properties"] : T;

type RequiredOf<T> = T extends ParamSchema
	? T["required"][number]
	: keyof T & string;

type MergeProperties<T> = {
	[K in T extends unknown ? keyof T : never]: T extends Record<K, infer V>
		? V
		: never;
};

function isParamSchema(input: ParamInput): input is ParamSchema {
	return (
		input.type === "object" &&
		Array.isArray(input.required) &&
		typeof input.properties === "object" &&
		input.properties !== null
	);
}

export function createParamSchema<
	const T extends readonly [ParamInput, ...ParamInput[]],
>(...inputs: T) {
	const properties: Record<string, JSONSchema> = {};
	const required = new Set<string>();

	for (const input of inputs) {
		const schema = isParamSchema(input);
		const fields = schema ? input.properties : input;
		const requiredNames = schema ? input.required : Object.keys(fields);

		for (const [name, definition] of Object.entries(fields)) {
			if (Object.hasOwn(properties, name)) {
				throw new Error(`Duplicate route parameter: "${name}"`);
			}

			properties[name] = definition;
		}

		for (const name of requiredNames) {
			if (!Object.hasOwn(fields, name)) {
				throw new Error(`Required parameter "${name}" has no schema`);
			}

			required.add(name);
		}
	}

	return {
		type: "object",
		additionalProperties: false,
		properties: properties as MergeProperties<PropertiesOf<T[number]>>,
		required: [...required] as RequiredOf<T[number]>[],
	} as const;
}
