import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { UserService } from "../../../core/services/user.service.js";
import type { UserSettingsService } from "../../../core/services/user-settings.service.js";
import { toUserSettingsViewModel } from "../../mappers/user-settings.mapper.js";
import {
	getUserSettingsSchema,
	replaceUserSettingsSchema,
	type ReplaceUserSettingsBody,
} from "../../schema/user-settings.schema.js";
import { getUserSchema } from "../../schema/user.schema.js";
import type { UserViewModel } from "../../viewmodels/user.viewmodel.js";

export function createUserRoutes(
	userService: UserService,
	userSettingsService: UserSettingsService,
): FastifyPluginAsync {
	return async (app: FastifyInstance) => {
		app.get(
			"/",
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

		app.get(
			"/setting",
			{ schema: getUserSettingsSchema },
			async (request: FastifyRequest, reply: FastifyReply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const settings = await userSettingsService.getSettings(providerId);
				return reply.code(200).send(toUserSettingsViewModel(settings));
			},
		);

		app.put<{ Body: ReplaceUserSettingsBody }>(
			"/setting",
			{ schema: replaceUserSettingsSchema },
			async (
				request: FastifyRequest<{ Body: ReplaceUserSettingsBody }>,
				reply: FastifyReply,
			) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const settings = await userSettingsService.replaceSettings(
					providerId,
					request.body,
				);
				return reply.code(200).send(toUserSettingsViewModel(settings));
			},
		);
	};
}
