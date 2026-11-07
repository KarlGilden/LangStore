import { getAuth } from "@clerk/fastify";
import type { preHandlerHookHandler } from "fastify";
import type { UserService } from "../../core/services/user.service.js";

export function createRequireAuth(
	userService: Pick<UserService, "getOrCreateUser">,
): preHandlerHookHandler {
	return async (request, reply) => {
		const { isAuthenticated, userId: providerId } = getAuth(request);

		if (!isAuthenticated || !providerId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const user = await userService.getOrCreateUser(providerId);
		request.currentUserId = user.id;
	};
}
