import { createCollectionService } from "../../core/services/collection.service.js";
import { createEntryEncounterService } from "../../core/services/entry-encounter.service.js";
import { createEntryService } from "../../core/services/entry.service.js";
import { createPageIngestionService } from "../../core/services/page-ingestion.service.js";
import { createPageService } from "../../core/services/page.service.js";
import { createUserSettingsService } from "../../core/services/user-settings.service.js";
import { createUserService } from "../../core/services/user.service.js";
import { createWordExtractionService } from "../../core/services/word-extraction.service.js";
import { getClerkAuthenticatedProviderId } from "../hooks/auth.hook.js";
import type { ExternalServices } from "./externalServices.js";
import type { Repositories } from "./repository.js";

export function createServices(
	repositories: Repositories,
	externalServices: ExternalServices,
) {
	const {
		userRepository,
		collectionRepository,
		pageRepository,
		pageIngestionRepository,
		userSettingsRepository,
		entryEncounterRepository,
		entryRepository,
	} = repositories;

	const getAuthenticatedProviderId = getClerkAuthenticatedProviderId;

	const { identityProfileService, textRecognitionService } = externalServices;

	const userService = createUserService({
		userRepository,
		identityProfileService: identityProfileService.service,
	});

	const userSettingsService = createUserSettingsService({
		userSettingsRepository,
	});

	const collectionService = createCollectionService({
		collectionRepository,
	});

	const entryService = createEntryService({ entryRepository });

	const entryEncounterService = createEntryEncounterService({
		entryEncounterRepository,
		pageRepository,
		entryRepository,
	});

	const pageService = createPageService({
		pageRepository,
		collectionRepository,
	});

	const wordExtractionService = createWordExtractionService();

	const pageIngestionService = createPageIngestionService({
		pageIngestionRepository,
		wordExtractionService,
		textRecognitionService: textRecognitionService.service,
		collectionService,
	});

	return {
		userService,
		collectionService,
		entryService,
		entryEncounterService,
		pageService,
		wordExtractionService,
		pageIngestionService,
		userSettingsService,
		getAuthenticatedProviderId,
	};
}
