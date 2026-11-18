import type { FastifyPluginAsync } from "fastify";
import {
	createPageSchema,
	getLatestPageSchema,
	getPageSchema,
	getPageVocabularySchema,
	listCollectionPagesSchema,
	savePageEntriesSchema,
} from "@langstore/contracts";
import type { PageService } from "../../../core/services/page.service.js";
import type { EntryEncounterService } from "../../../core/services/entry-encounter.service.js";
import { toPageVocabularyEntryViewModel } from "../../mappers/entry-encounter.mapper.js";
import { toPageViewModel } from "../../mappers/page.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import type { EntryService } from "../../../core/services/entry.service.js";
import { toEntryViewModel } from "../../mappers/entry.mapper.js";

export function createPageRoutes(
	pageService: PageService,
	entryEncounterService: EntryEncounterService,
	entryService: EntryService,
): FastifyPluginAsync {
	return async (app) => {
		const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

		routes.get(
			"/latest",
			{ schema: getLatestPageSchema },
			async (request, reply) => {
				const userId = request.currentUserId;
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.getLatestPage(
					userId,
					request.params.iso,
				);
				return reply.code(200).send(toPageViewModel(page));
			},
		);

		routes.get("/:id", { schema: getPageSchema }, async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const page = await pageService.getPage(
				userId,
				request.params.iso,
				request.params.id,
			);
			return reply.code(200).send(toPageViewModel(page));
		});

		routes.get(
			"/:id/vocabulary",
			{ schema: getPageVocabularySchema },
			async (request, reply) => {
				const userId = request.currentUserId;
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const vocabulary = await entryEncounterService.getPageVocabulary(
					userId,
					request.params.iso,
					request.params.id,
				);
				return reply
					.code(200)
					.send(vocabulary.map(toPageVocabularyEntryViewModel));
			},
		);

		routes.post(
			"/:id/entries",
			{ schema: savePageEntriesSchema },
			async (request, reply) => {
				const userId = request.currentUserId;
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const savedEntries = await entryService.savePageEntries(
					userId,
					request.params.iso,
					request.params.id,
					request.body.entries,
				);
				return reply.code(200).send(savedEntries.map(toEntryViewModel));
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
				const userId = request.currentUserId;
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const page = await pageService.createPage(userId, request.params.iso, {
					...request.body,
					collectionId: request.params.collectionId,
					summary: null,
				});
				return reply.code(201).send(toPageViewModel(page));
			},
		);

		routes.get(
			"/:collectionId/page",
			{ schema: listCollectionPagesSchema },
			async (request, reply) => {
				const userId = request.currentUserId;
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const pages = await pageService.getAllCollectionPages(
					userId,
					request.params.iso,
					request.params.collectionId,
				);
				return reply.code(200).send(pages.map(toPageViewModel));
			},
		);
	};
}
