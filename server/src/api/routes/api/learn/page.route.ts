import type { FastifyPluginAsync } from "fastify";
import {
	createPageSchema,
	getLatestPageSchema,
	getPageSchema,
	getPageVocabularySchema,
	listCollectionPagesSchema,
	savePageEntriesSchema,
} from "@langstore/contracts";
import { toPageVocabularyEntryViewModel } from "../../../mappers/entry-encounter.mapper.js";
import { toPageViewModel } from "../../../mappers/page.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { toEntryViewModel } from "../../../mappers/entry.mapper.js";
import { getApplicationServices } from "../../../composition/serviceUtils.js";

export const pageRoutes: FastifyPluginAsync = async (app) => {
	const { pageService, entryEncounterService, entryService } =
		getApplicationServices(app);
	const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

	routes.get(
		"/latest",
		{ schema: getLatestPageSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const page = await pageService.getLatestPage(userId, request.params.iso);
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
