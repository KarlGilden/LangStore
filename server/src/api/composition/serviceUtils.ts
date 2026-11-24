import type { FastifyInstance } from "fastify";
import type { CollectionService } from "../../core/services/collection.service.js";
import type { EntryEncounterService } from "../../core/services/entry-encounter.service.js";
import type { EntryService } from "../../core/services/entry.service.js";
import type { PageIngestionService } from "../../core/services/page-ingestion.service.js";
import type { PageService } from "../../core/services/page.service.js";
import type { UserSettingsService } from "../../core/services/user-settings.service.js";
import type { UserService } from "../../core/services/user.service.js";
import type { GetAuthenticatedProviderId } from "../hooks/auth.hook.js";

export const APPLICATION_SERVICES_DECORATOR = "applicationServices";

export interface ApplicationServices {
	userService: UserService;
	userSettingsService: UserSettingsService;
	collectionService: CollectionService;
	pageService: PageService;
	entryService: EntryService;
	entryEncounterService: EntryEncounterService;
	pageIngestionService: PageIngestionService;
	getAuthenticatedProviderId: GetAuthenticatedProviderId;
}

export function getApplicationServices(
	app: FastifyInstance,
): ApplicationServices {
	return app.getDecorator<ApplicationServices>(APPLICATION_SERVICES_DECORATOR);
}
