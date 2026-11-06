import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../auth/auth.hook.js";
import { createUserRoutes } from "./user.route.js";
import type { UserService } from "../../../core/services/user.service.js";
import type { UserSettingsService } from "../../../core/services/user-settings.service.js";
import type { CollectionService } from "../../../core/services/collection.service.js";
import { createCollectionRoutes } from "./collection.route.js";
import type { PageService } from "../../../core/services/page.service.js";
import {
	createCollectionPageRoutes,
	createPageRoutes,
} from "./page.route.js";
import type { EntryService } from "../../../core/services/entry.service.js";
import { createEntryRoutes } from "./entry.route.js";
import type { EntryEncounterService } from "../../../core/services/entry-encounter.service.js";
import type { PageIngestionService } from "../../../core/services/page-ingestion.service.js";
import { createPageIngestionRoutes } from "./page-ingestion.route.js";

export function createProtectedRoutes(
	userService: UserService,
	userSettingsService: UserSettingsService,
	collectionService: CollectionService,
	pageService: PageService,
	entryService: EntryService,
	entryEncounterService: EntryEncounterService,
	pageIngestionService: PageIngestionService,
): FastifyPluginAsync {
	return async (app) => {
		app.addHook("preHandler", requireAuth);
		app.register(createUserRoutes(userService, userSettingsService), {
			prefix: "/user",
		});
		app.register(createCollectionRoutes(collectionService), {
			prefix: "/:iso/collection",
		});
		app.register(createPageRoutes(pageService, entryEncounterService), {
			prefix: "/:iso/page",
		});
		app.register(createCollectionPageRoutes(pageService), {
			prefix: "/:iso/collection",
		});
		app.register(createPageIngestionRoutes(pageIngestionService), {
			prefix: "/:iso/collection",
		});
		app.register(createEntryRoutes(entryService), {
			prefix: "/entry",
		});
	};
}
