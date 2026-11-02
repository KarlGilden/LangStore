import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { healthRoutes } from "./routes/health.js";
import { errorHandler } from "./middleware/errors.js";

export function buildApp(options: FastifyServerOptions = {}): FastifyInstance {
	const app = Fastify(options);

	app.setErrorHandler(errorHandler);
	app.register(healthRoutes);

	return app;
}
