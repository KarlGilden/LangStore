import type { FastifyPluginAsync } from "fastify";
import type { PageService } from "../../../core/services/page.service.js";
import { toPageViewModel } from "../../mappers/page.mapper.js";
import {
	getLatestPageSchema,
	getPageSchema,
	listCollectionPagesSchema,
	type CollectionPagesParams,
	type LanguageParams,
	type PageParams,
} from "../../schema/page.schema.js";

export function createPageRoutes(pageService: PageService): FastifyPluginAsync {
	return async (app) => {
		app.get<{ Params: LanguageParams }>(
			"/pages/latest",
			{ schema: getLatestPageSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.getLatestPage(
					providerId,
					request.params.iso,
				);
				return reply.code(200).send(toPageViewModel(page));
			},
		);

		app.get<{ Params: PageParams }>(
			"/pages/:id",
			{ schema: getPageSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.getPage(
					providerId,
					request.params.iso,
					request.params.id,
				);
				return reply.code(200).send(toPageViewModel(page));
			},
		);

		app.get<{ Params: CollectionPagesParams }>(
			"/collections/:collectionId/pages",
			{ schema: listCollectionPagesSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const pages = await pageService.listCollectionPages(
					providerId,
					request.params.iso,
					request.params.collectionId,
				);
				return reply.code(200).send(pages.map(toPageViewModel));
			},
		);
	};
}
