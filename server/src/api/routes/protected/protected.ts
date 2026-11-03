import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../auth/auth.hook.js";
import { createUserRoutes } from "./user.route.js";
import type { UserService } from "../../../core/services/user.service.js";
import type { ClerkClient } from "@clerk/fastify";

export function createProtectedRoutes(
	userService: UserService,
	clerkClient: ClerkClient,
): FastifyPluginAsync {
	return async (app) => {
		app.addHook("preHandler", requireAuth);
		app.register(createUserRoutes(userService, clerkClient));
	};
}
