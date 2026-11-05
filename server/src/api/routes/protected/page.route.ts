import type { FastifyPluginAsync } from "fastify";
import type { PageService } from "../../../core/services/page.service.js";
import { toPageViewModel } from "../../mappers/page.mapper.js";
import {
	createPageSchema,
	getLatestPageSchema,
	getPageSchema,
	listCollectionPagesSchema,
	type CollectionPagesParams,
	type CreatePageBody,
	type LanguageParams,
	type PageParams,
} from "../../schema/page.schema.js";

export function createPageRoutes(pageService: PageService): FastifyPluginAsync {
	return async (app) => {
		app.get<{ Params: LanguageParams }>(
			"/latest",
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
			"/:id",
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

	};
}

export function createCollectionPageRoutes(
	pageService: PageService,
): FastifyPluginAsync {
	return async (app) => {
		app.post<{ Params: CollectionPagesParams; Body: CreatePageBody }>(
			"/:collectionId/page",
			{ schema: createPageSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.createPage(
					providerId,
					request.params.iso,
					{
						...request.body,
						collectionId: request.params.collectionId,
					},
				);
				return reply.code(201).send(toPageViewModel(page));
			},
		);

		app.get<{ Params: CollectionPagesParams }>(
			"/:collectionId/page",
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
