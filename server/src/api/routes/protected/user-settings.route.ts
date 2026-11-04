import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { UserSettingsService } from "../../../core/services/user-settings.service.js";
import { toUserSettingsViewModel } from "../../mappers/user-settings.mapper.js";
import {
	getUserSettingsSchema,
	replaceUserSettingsSchema,
	type ReplaceUserSettingsBody,
} from "../../schema/user-settings.schema.js";

export function createUserSettingsRoutes(
	userSettingsService: UserSettingsService,
): FastifyPluginAsync {
	return async (app) => {
		app.get("/settings", { schema: getUserSettingsSchema }, async (
			request: FastifyRequest,
			reply: FastifyReply,
		) => {
			const providerId = request.authenticatedUserId;
			if (!providerId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const settings = await userSettingsService.getSettings(providerId);
			return reply.code(200).send(toUserSettingsViewModel(settings));
		});

		app.put<{ Body: ReplaceUserSettingsBody }>(
			"/settings",
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
