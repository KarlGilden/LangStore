import "dotenv/config";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createProductionDependencies } from "./composition/production.js";

let app: FastifyInstance | undefined;
let closePromise: Promise<void> | undefined;

async function shutdown(): Promise<void> {
	if (!app) return;
	closePromise ??= app.close();

	try {
		await closePromise;
	} catch (error) {
		app.log.error(error, "Failed to close the server");
		process.exitCode = 1;
	}
}

try {
	const config = loadConfig();
	const dependencies = await createProductionDependencies(config);

	app = await buildApp(dependencies, {
		logger: { redact: ["req.headers.authorization", "req.headers.cookie"] },
	});

	process.once("SIGINT", shutdown);
	process.once("SIGTERM", shutdown);

	await app.listen({ port: config.PORT, host: config.HOST });
} catch (error) {
	if (app) {
		app.log.error(error, "Server startup failed");
	} else {
		console.error("Server startup failed", error);
	}

	process.exitCode = 1;
	await shutdown();
}
