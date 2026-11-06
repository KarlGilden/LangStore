import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import multipart from "@fastify/multipart";
import { healthRoutes } from "./routes/health.route.js";
import { errorHandler } from "./middleware/errors.js";
import { clerkPlugin } from "@clerk/fastify";
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
import { createDrizzlePageIngestionPersistence } from "../infrastructure/repositories/page-ingestion.persistence.drizzle.js";
import { createGoogleTextRecognitionProvider } from "../infrastructure/ocr/google-text-recognition.provider.js";
import { createPageIngestionService } from "../core/services/page-ingestion.service.js";
import { createWordExtractionService } from "../core/services/word-extraction.service.js";

export async function buildApp(
	options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
	const app = Fastify(options);

	/* Register plugins */
	await registerEnv(app);
	await app.register(multipart);

	// error handling
	app.setErrorHandler(errorHandler);

	// db
	const { db, close: closeDatabase } = createDatabase(app.config.DATABASE_URL);

	// auth
	app.register(clerkPlugin, {
		publishableKey: app.config.CLERK_PUBLISHABLE_KEY,
		secretKey: app.config.CLERK_SECRET_KEY,
	});

	const identityProfileProvider = createClerkAdapter({
		publishableKey: app.config.CLERK_PUBLISHABLE_KEY,
		secretKey: app.config.CLERK_SECRET_KEY,
	});

	app.decorateRequest("authenticatedUserId", null);

	// external services
	const { textRecognitionProvider, close: closeTextRecognition } =
		createGoogleTextRecognitionProvider({
			projectId: app.config.GOOGLE_CLOUD_PROJECT_ID,
			location: app.config.GOOGLE_CLOUD_LOCATION,
			processorId: app.config.GOOGLE_CLOUD_PROCESSOR_ID,
			credentials: app.config.GOOGLE_APPLICATION_CREDENTIALS,
		});

	// repositories
	const userRepository = createDrizzleUserRepository(db);
	const userSettingsRepository = createDrizzleUserSettingsRepository(db);
	const collectionRepository = createDrizzleCollectionRepository(db);
	const pageRepository = createDrizzlePageRepository(db);
	const entryRepository = createDrizzleEntryRepository(db);
	const entryEncounterRepository = createDrizzleEntryEncounterRepository(db);
	const pageIngestionPersistence = createDrizzlePageIngestionPersistence(db);

	// services
	const userService = createUserService(
		userRepository,
		identityProfileProvider,
	);
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
	const pageIngestionService = createPageIngestionService(
		collectionService,
		textRecognitionProvider,
		createWordExtractionService(),
		entryRepository,
		pageIngestionPersistence,
	);

	app.addHook("onClose", async () => {
		await Promise.all([closeDatabase(), closeTextRecognition()]);
	});

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
			pageIngestionService,
		),
		{
			prefix: "/api",
		},
	);

	return app;
}
