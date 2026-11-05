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
import { createDrizzleUserSettingsRepository } from "../infrastructure/repositories/user-settings.repository.drizzle.js";
import { createUserSettingsService } from "../core/services/user-settings.service.js";
import { createDrizzleCollectionRepository } from "../infrastructure/repositories/collection.repository.drizzle.js";
import { createCollectionService } from "../core/services/collection.service.js";
import { createDrizzlePageRepository } from "../infrastructure/repositories/page.repository.drizzle.js";
import { createPageService } from "../core/services/page.service.js";
import { createDrizzleEntryRepository } from "../infrastructure/repositories/entry.repository.drizzle.js";
import { createEntryService } from "../core/services/entry.service.js";
import { createDrizzleEntryEncounterRepository } from "../infrastructure/repositories/entry-encounter.repository.drizzle.js";
import { createEntryEncounterService } from "../core/services/entry-encounter.service.js";
import type { TextRecognitionProvider } from "../core/port/text-recognition.provider.js";
import type { TranslationProvider } from "../core/port/translation.provider.js";
import type { PageIngestionServiceDependencies } from "../core/services/page-ingestion.service.js";
import type { Database } from "../infrastructure/data/db.js";
import { createDrizzlePageIngestionPersistence } from "../infrastructure/repositories/page-ingestion.persistence.drizzle.js";

export interface PageIngestionProviders {
	textRecognitionProvider: TextRecognitionProvider;
	translationProvider: TranslationProvider;
}

export function composePageIngestionDependencies(
	db: Database,
	providers: PageIngestionProviders,
): PageIngestionServiceDependencies {
	return {
		...providers,
		persistence: createDrizzlePageIngestionPersistence(db),
	};
}

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
	const userSettingsRepository = createDrizzleUserSettingsRepository(db);
	const collectionRepository = createDrizzleCollectionRepository(db);
	const pageRepository = createDrizzlePageRepository(db);
	const entryRepository = createDrizzleEntryRepository(db);
	const entryEncounterRepository = createDrizzleEntryEncounterRepository(db);

	// services
	const userService = createUserService(userRepository, identityProfileReader);
	const userSettingsService = createUserSettingsService(
		userSettingsRepository,
		userService,
	);
	const collectionService = createCollectionService(
		collectionRepository,
		userService,
	);
	const pageService = createPageService(
		pageRepository,
		collectionRepository,
		userService,
	);
	const entryService = createEntryService(
		entryRepository,
		userService,
		userSettingsService,
	);
	const entryEncounterService = createEntryEncounterService(
		entryEncounterRepository,
		entryRepository,
		pageRepository,
		userService,
	);

	// routes
	app.register(healthRoutes);
	app.register(
		createProtectedRoutes(
			userService,
			userSettingsService,
			collectionService,
			pageService,
			entryService,
			entryEncounterService,
		),
		{
			prefix: "/api",
		},
	);

	return app;
}
