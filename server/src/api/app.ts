import { clerkPlugin } from "@clerk/fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { applicationPlugin } from "./plugins/application.js";
import type { ApplicationServices } from "./composition/serviceUtils.js";
import { errorHandler } from "./middleware/errors.js";
import { healthRoutes } from "./routes/health.route.js";

interface ClerkPluginConfig {
	publishableKey: string;
	secretKey: string;
}

export interface BuildAppDependencies {
	services: ApplicationServices;
	authConfig?: ClerkPluginConfig;
	close?: () => Promise<void>;
}

export async function buildApp(
	dependencies: BuildAppDependencies,
	options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
	const app = Fastify(options);

	if (dependencies.close) {
		app.addHook("onClose", dependencies.close);
	}

	await app.register(cors, {
		origin: ["http://localhost:5173"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	});

	await app.register(multipart);

	if (dependencies.authConfig) {
		await app.register(clerkPlugin, {
			...dependencies.authConfig,
			hookName: "onRequest",
		});
	}

	app.setErrorHandler(errorHandler);

	app.register(healthRoutes);
	app.register(applicationPlugin, {
		prefix: "/api",
		services: dependencies.services,
	});

	return app;
}
