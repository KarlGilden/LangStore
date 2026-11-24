import type { FastifyPluginAsync } from "fastify";
import { createAuthHook } from "../../hooks/auth.hook.js";
import { userRoutes } from "./user.route.js";
import { getApplicationServices } from "../../composition/serviceUtils.js";
import { learnRoutes } from "./learn/index.js";

export const apiRoutes: FastifyPluginAsync = async (app) => {
	const { userService, getAuthenticatedProviderId } =
		getApplicationServices(app);

	app.decorateRequest("currentUserId", null);

	app.addHook(
		"onRequest",
		createAuthHook(userService, getAuthenticatedProviderId),
	);

	app.register(learnRoutes, { prefix: "/:iso" });
	app.register(userRoutes, { prefix: "/user" });
};
