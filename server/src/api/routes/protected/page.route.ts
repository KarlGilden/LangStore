import type { FastifyPluginAsync } from "fastify";
import type { PageService } from "../../../core/services/page.service.js";
import type { EntryEncounterService } from "../../../core/services/entry-encounter.service.js";
import { toPageVocabularyEntryViewModel } from "../../mappers/entry-encounter.mapper.js";
import { toPageViewModel } from "../../mappers/page.mapper.js";
import {
	createPageSchema,
	getLatestPageSchema,
	getPageSchema,
	getPageVocabularySchema,
	listCollectionPagesSchema,
} from "../../schema/page.schema.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";

export function createPageRoutes(
	pageService: PageService,
	entryEncounterService: EntryEncounterService,
): FastifyPluginAsync {
	return async (app) => {
		const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

		routes.get(
			"/latest",
			{ schema: getLatestPageSchema },
			async (request, reply) => {
				const providerId = request.currentUserId;
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

		routes.get("/:id", { schema: getPageSchema }, async (request, reply) => {
			const providerId = request.currentUserId;
			if (!providerId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const page = await pageService.getPage(
				providerId,
				request.params.iso,
				request.params.id,
			);
			return reply.code(200).send(toPageViewModel(page));
		});

		routes.get(
			"/:id/vocabulary",
			{ schema: getPageVocabularySchema },
			async (request, reply) => {
				const providerId = request.currentUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const vocabulary = await entryEncounterService.getPageVocabulary(
					providerId,
					request.params.iso,
					request.params.id,
				);
				return reply
					.code(200)
					.send(vocabulary.map(toPageVocabularyEntryViewModel));
			},
		);
	};
}

export function createCollectionPageRoutes(
	pageService: PageService,
): FastifyPluginAsync {
	return async (app) => {
		const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

		routes.post(
			"/:collectionId/page",
			{ schema: createPageSchema },
			async (request, reply) => {
				const providerId = request.currentUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.createPage(
					providerId,
					request.params.iso,
					{
						...request.body,
						collectionId: request.params.collectionId,
						summary: null,
					},
				);
				return reply.code(201).send(toPageViewModel(page));
			},
		);

		routes.get(
			"/:collectionId/page",
			{ schema: listCollectionPagesSchema },
			async (request, reply) => {
				const providerId = request.currentUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const pages = await pageService.getAllCollectionPages(
					providerId,
					request.params.iso,
					request.params.collectionId,
				);
				return reply.code(200).send(pages.map(toPageViewModel));
			},
		);
	};
}
