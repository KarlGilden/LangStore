import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";

export interface AppConfig {
	PORT: number;
	HOST: string;
	DATABASE_URL: string;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
}

const schema = {
	type: "object",
	required: ["DATABASE_URL", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"],
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
