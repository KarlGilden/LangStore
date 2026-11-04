import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { healthRoutes } from "./routes/health.route.js";
import { errorHandler } from "./middleware/errors.js";
import { clerkPlugin, createClerkClient } from "@clerk/fastify";
import { createProtectedRoutes } from "./routes/protected/protected.js";
import { createUserService } from "../core/services/user.service.js";
import { registerEnv } from "./config.js";
import { createDatabase } from "../infrastructure/data/db.js";
import { createDrizzleUserRepository } from "../infrastructure/repositories/user.repository.drizzle.js";
import { createClerkAdapter } from "../infrastructure/auth/clerk.adapter.js";

export async function buildApp(
	options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
	const app = Fastify(options);

	/* Register plugins */
	await registerEnv(app);

	// db
	const { db, close } = createDatabase(app.config.DATABASE_URL);

	app.addHook("onClose", async () => {
		await close();
	});

	// auth
	app.register(clerkPlugin, {
		publishableKey: app.config.CLERK_PUBLISHABLE_KEY,
		secretKey: app.config.CLERK_SECRET_KEY,
	});

	const clerkClient = createClerkClient({
		publishableKey: app.config.CLERK_PUBLISHABLE_KEY,
		secretKey: app.config.CLERK_SECRET_KEY,
	});

	const identityProfileReader = createClerkAdapter(clerkClient);

	app.decorateRequest("authenticatedUserId", null);

	// error handling
	app.setErrorHandler(errorHandler);

	// repositories
	const userRepository = createDrizzleUserRepository(db);

	// services
	const userService = createUserService(userRepository, identityProfileReader);

	// routes
	app.register(healthRoutes);
	app.register(createProtectedRoutes(userService), {
		prefix: "/api",
	});

	return app;
}
