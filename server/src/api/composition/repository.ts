import type { Database } from "../../infrastructure/data/db.js";
import { createDrizzleCollectionRepository } from "../../infrastructure/repositories/collection.repository.drizzle.js";
import { createDrizzleEntryEncounterRepository } from "../../infrastructure/repositories/entry-encounter.repository.drizzle.js";
import { createDrizzleEntryRepository } from "../../infrastructure/repositories/entry.repository.drizzle.js";
import { createDrizzlePageIngestionRepository } from "../../infrastructure/repositories/page-ingestion.repository.drizzle.js";
import { createDrizzlePageRepository } from "../../infrastructure/repositories/page.repository.drizzle.js";
import { createDrizzleUserSettingsRepository } from "../../infrastructure/repositories/user-settings.repository.drizzle.js";
import { createDrizzleUserRepository } from "../../infrastructure/repositories/user.repository.drizzle.js";

export function createRepositories(db: Database) {
	return {
		userRepository: createDrizzleUserRepository(db),
		userSettingsRepository: createDrizzleUserSettingsRepository(db),
		collectionRepository: createDrizzleCollectionRepository(db),
		pageRepository: createDrizzlePageRepository(db),
		pageIngestionRepository: createDrizzlePageIngestionRepository(db),
		entryRepository: createDrizzleEntryRepository(db),
		entryEncounterRepository: createDrizzleEntryEncounterRepository(db),
	};
}

export type Repositories = ReturnType<typeof createRepositories>;
