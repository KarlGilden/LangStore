import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { CollectionService } from "../../../core/services/collection.service.js";
import { toCollectionViewModel } from "../../mappers/collection.mapper.js";
import {
	createCollectionSchema,
	getCollectionSchema,
	listCollectionsSchema,
	updateCollectionSchema,
	type CollectionParams,
	type CreateCollectionBody,
	type UpdateCollectionBody,
} from "../../schema/collection.schema.js";

export function createCollectionRoutes(
	collectionService: CollectionService,
): FastifyPluginAsync {
	return async (app) => {
		app.post<{ Body: CreateCollectionBody }>(
			"/",
			{ schema: createCollectionSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const collection = await collectionService.createCollection(
					providerId,
					request.body,
				);
				return reply.code(201).send(toCollectionViewModel(collection));
			},
		);

		app.get(
			"/",
			{ schema: listCollectionsSchema },
			async (request: FastifyRequest, reply: FastifyReply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const collections =
					await collectionService.listCollections(providerId);
				return reply.code(200).send(collections.map(toCollectionViewModel));
			},
		);

		app.get<{ Params: CollectionParams }>(
			"/:id",
			{ schema: getCollectionSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const collection = await collectionService.getCollection(
					providerId,
					request.params.id,
				);
				return reply.code(200).send(toCollectionViewModel(collection));
			},
		);

		app.put<{ Params: CollectionParams; Body: UpdateCollectionBody }>(
			"/:id",
			{ schema: updateCollectionSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const collection = await collectionService.updateCollection(
					providerId,
					request.params.id,
					request.body,
				);
				return reply.code(200).send(toCollectionViewModel(collection));
			},
		);
	};
}
