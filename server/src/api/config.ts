import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";

export interface AppConfig {
	PORT: number;
	HOST: string;
	DATABASE_URL: string;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	GOOGLE_CLOUD_PROJECT_ID: string;
	GOOGLE_CLOUD_LOCATION: string;
	GOOGLE_CLOUD_PROCESSOR_ID: string;
	GOOGLE_APPLICATION_CREDENTIALS: string;
}

const schema = {
	type: "object",
	required: [
		"DATABASE_URL",
		"CLERK_SECRET_KEY",
		"CLERK_PUBLISHABLE_KEY",
		"GOOGLE_CLOUD_PROJECT_ID",
		"GOOGLE_CLOUD_LOCATION",
		"GOOGLE_CLOUD_PROCESSOR_ID",
		"GOOGLE_APPLICATION_CREDENTIALS",
	],
	properties: {
		PORT: {
			type: "integer",
			default: 3000,
		},
		HOST: {
			type: "string",
			default: "0.0.0.0",
		},
		DATABASE_URL: {
			type: "string",
			minLength: 1,
		},
		CLERK_SECRET_KEY: {
			type: "string",
			minLength: 1,
		},
		CLERK_PUBLISHABLE_KEY: {
			type: "string",
			minLength: 1,
		},
		GOOGLE_CLOUD_PROJECT_ID: {
			type: "string",
			minLength: 1,
		},
		GOOGLE_CLOUD_LOCATION: {
			type: "string",
			minLength: 1,
		},
		GOOGLE_CLOUD_PROCESSOR_ID: {
			type: "string",
			minLength: 1,
		},
		GOOGLE_APPLICATION_CREDENTIALS: {
			type: "string",
			minLength: 1,
		},
	},
} as const;

declare module "fastify" {
	interface FastifyInstance {
		config: AppConfig;
	}
}

export async function registerEnv(app: FastifyInstance) {
	await app.register(fastifyEnv, {
		schema,
		dotenv: true,
	});
}
