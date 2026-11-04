import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../auth/auth.hook.js";
import { createUserRoutes } from "./user.route.js";
import type { UserService } from "../../../core/services/user.service.js";
import type { UserSettingsService } from "../../../core/services/user-settings.service.js";
import type { CollectionService } from "../../../core/services/collection.service.js";
import { createCollectionRoutes } from "./collection.route.js";

export function createProtectedRoutes(
	userService: UserService,
	userSettingsService: UserSettingsService,
	collectionService: CollectionService,
): FastifyPluginAsync {
	return async (app) => {
		app.addHook("preHandler", requireAuth);
		app.register(createUserRoutes(userService, userSettingsService), {
			prefix: "/user",
		});
		app.register(createCollectionRoutes(collectionService), {
			prefix: "/collections",
		});
	};
}
