import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { UserService } from "../../../core/services/user.service.js";
import { getUserSchema } from "../../schema/user.schema.js";
import type { UserViewModel } from "../../viewmodels/user.viewmodel.js";

export function createUserRoutes(userService: UserService): FastifyPluginAsync {
	return async (app: FastifyInstance) => {
		app.get(
			"/user",
			{
				schema: getUserSchema,
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const userId = request.authenticatedUserId;

				if (!userId) {
					return reply.code(401).send({
						error: "Unauthorized",
					});
				}

				const user = await userService.getOrCreateUser(userId);

				const response: UserViewModel = {
					id: user.id,
					username: user.username,
					email: user.email,
					createdAt: user.createdAt.toISOString(),
				};

				return reply.code(200).send(response);
			},
		);
	};
}
