import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { UserService } from "../../../core/services/user.service.js";
import { getUserSchema } from "../../schema/user.schema.js";

export function createUserRoutes(userService: UserService): FastifyPluginAsync {
	return async (app: FastifyInstance) => {
		app.get(
			"/user",
			{
				schema: {
					response: {
						200: getUserSchema,
					},
				},
			},
			async (request: FastifyRequest, reply: FastifyReply) => {
				const userId = request.authenticatedUserId;

				if (!userId) {
					return reply.code(401).send({
						error: "Unauthorized",
					});
				}

				let user = await userService.getOrCreateUser(userId);

				return reply.code(200).send({
					email: user.email,
				});
			},
		);
	};
}
