import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { UserService } from "../../../core/services/user.service.js";
import { type ClerkClient } from "@clerk/fastify";
import { getUserSchema } from "../../schema/user.schema.js";

export function createUserRoutes(
	userService: UserService,
	clerkClient: ClerkClient,
): FastifyPluginAsync {
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

				let user = await userService.findByProviderId(userId);

				if (!user) {
					const clerkUser = await clerkClient.users.getUser(userId);

					const email = clerkUser.emailAddresses.find(
						(address) => address.id === clerkUser.primaryEmailAddressId,
					)?.emailAddress;

					if (!email) {
						return reply.code(400).send({
							error: "User has no email address",
						});
					}

					user = await userService.createUser({
						providerId: userId,
						email,
					});

					if (!user) {
						return reply.code(500).send({
							error: "Failed to create existing user",
						});
					}
				}

				return reply.code(200).send({
					email: user.email,
				});
			},
		);
	};
}
