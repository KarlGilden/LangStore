import { getAuth } from "@clerk/fastify";
import type { preHandlerHookHandler } from "fastify";

export const requireAuth: preHandlerHookHandler = async (request, reply) => {
	const { isAuthenticated, userId } = getAuth(request);

	if (!isAuthenticated || !userId) {
		return reply.code(401).send({
			error: "Unauthorized",
		});
	}

	request.authenticatedUserId = userId;
};
