import type { FastifyPluginAsync } from "fastify";
import {
	getUserSchema,
	getUserSettingsSchema,
	replaceUserSettingsSchema,
} from "@langstore/contracts";
import { toUserSettingsViewModel } from "../../mappers/user-settings.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { toUserViewModel } from "../../mappers/user.mapper.js";
import { getApplicationServices } from "../../composition/serviceUtils.js";

export const userRoutes: FastifyPluginAsync = async (app) => {
	const { userService, userSettingsService } = getApplicationServices(app);
	const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

	routes.get(
		"/",
		{
			schema: getUserSchema,
		},
		async (request, reply) => {
			const userId = request.currentUserId;

			if (!userId) {
				return reply.code(401).send({
					error: "Unauthorized",
				});
			}

			const user = await userService.getUserById(userId);

			return reply.code(200).send(toUserViewModel(user));
		},
	);

	routes.get(
		"/setting",
		{ schema: getUserSettingsSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const settings = await userSettingsService.getSettings(userId);
			return reply.code(200).send(toUserSettingsViewModel(settings));
		},
	);

	routes.put(
		"/setting",
		{ schema: replaceUserSettingsSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const settings = await userSettingsService.replaceSettings(
				userId,
				request.body,
			);
			return reply.code(200).send(toUserSettingsViewModel(settings));
		},
	);
};
