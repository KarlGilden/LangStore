import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../auth/auth.hook.js";
import { createUserRoutes } from "./user.route.js";
import type { UserService } from "../../../core/services/user.service.js";
import type { UserSettingsService } from "../../../core/services/user-settings.service.js";

export function createProtectedRoutes(
	userService: UserService,
	userSettingsService: UserSettingsService,
): FastifyPluginAsync {
	return async (app) => {
		app.addHook("preHandler", requireAuth);
		app.register(createUserRoutes(userService, userSettingsService), {
			prefix: "/user",
		});
	};
}
