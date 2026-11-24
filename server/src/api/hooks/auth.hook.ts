import { getAuth } from "@clerk/fastify";
import type { FastifyRequest, onRequestHookHandler } from "fastify";
import type { UserService } from "../../core/services/user.service.js";

export type GetAuthenticatedProviderId = (
	request: FastifyRequest,
) => string | null;

export const getClerkAuthenticatedProviderId: GetAuthenticatedProviderId = (
	request,
) => {
	const { isAuthenticated, userId } = getAuth(request);
	return isAuthenticated && userId ? userId : null;
};

export function createAuthHook(
	userService: Pick<UserService, "getOrCreateUser">,
	getAuthenticatedProviderId: GetAuthenticatedProviderId,
): onRequestHookHandler {
	return async (request, reply) => {
		const providerId = getAuthenticatedProviderId(request);

		if (!providerId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const user = await userService.getOrCreateUser(providerId);
		request.currentUserId = user.id;
	};
}
