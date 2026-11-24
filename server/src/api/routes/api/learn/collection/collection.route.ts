import type { FastifyPluginAsync } from "fastify";
import {
	createCollectionSchema,
	createPageSchema,
	deleteCollectionSchema,
	getCollectionSchema,
	listCollectionPagesSchema,
	listCollectionsSchema,
	updateCollectionSchema,
} from "@langstore/contracts";
import { toCollectionViewModel } from "../../../../mappers/collection.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { getApplicationServices } from "../../../../composition/serviceUtils.js";
import { toPageViewModel } from "../../../../mappers/page.mapper.js";

export const collectionRoutes: FastifyPluginAsync = async (app) => {
	const { collectionService } = getApplicationServices(app);
	const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

	routes.post(
		"/",
		{ schema: createCollectionSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const collection = await collectionService.createCollection(
				userId,
				request.params.iso,
				request.body,
			);
			return reply.code(201).send(toCollectionViewModel(collection));
		},
	);

	routes.get("/", { schema: listCollectionsSchema }, async (request, reply) => {
		const userId = request.currentUserId;
		if (!userId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const collections = await collectionService.getAllCollections(
			userId,
			request.params.iso,
		);
		return reply.code(200).send(collections.map(toCollectionViewModel));
	});

	routes.get(
		"/:id",
		{ schema: getCollectionSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const collection = await collectionService.getCollection(
				userId,
				request.params.iso,
				request.params.id,
			);

			return reply.code(200).send(toCollectionViewModel(collection));
		},
	);

	routes.put(
		"/:id",
		{ schema: updateCollectionSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const collection = await collectionService.updateCollection(
				userId,
				request.params.iso,
				request.params.id,
				request.body,
			);
			return reply.code(200).send(toCollectionViewModel(collection));
		},
	);

	routes.delete(
		"/:id",
		{ schema: deleteCollectionSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			await collectionService.deleteCollection(
				userId,
				request.params.iso,
				request.params.id,
			);
			return reply.code(204).send(null);
		},
	);
};

export const collectionPageRoutes: FastifyPluginAsync = async (app) => {
	const { pageService } = getApplicationServices(app);
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
