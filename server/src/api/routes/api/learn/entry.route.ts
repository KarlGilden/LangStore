import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
	createEntrySchema,
	getEntrySchema,
	listEntriesSchema,
	updateEntryTranslationsSchema,
} from "@langstore/contracts";
import {
	toEntryReviewViewModel,
	toEntryViewModel,
} from "../../../mappers/entry.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { getApplicationServices } from "../../../composition/serviceUtils.js";

export const entryRoutes: FastifyPluginAsync = async (app) => {
	const { entryService } = getApplicationServices(app);
	const routes = app.withTypeProvider<JsonSchemaToTsProvider>();

	routes.post("/", { schema: createEntrySchema }, async (request, reply) => {
		const userId = request.currentUserId;

		if (!userId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const entry = await entryService.createEntry(
			userId,
			request.params.iso,
			request.body,
		);
		return reply.code(201).send(toEntryViewModel(entry));
	});

	routes.get(
		"/",
		{ schema: listEntriesSchema },
		async (request: FastifyRequest, reply: FastifyReply) => {
			const userId = request.currentUserId;
			const iso = request.iso;

			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			if (!iso) {
				return reply.code(400).send({ error: "" });
			}

			const entries = await entryService.getAllEntriesForReview(userId, iso);
			return reply.code(200).send(entries.map(toEntryReviewViewModel));
		},
	);

	routes.patch(
		"/:id",
		{ schema: updateEntryTranslationsSchema },
		async (request, reply) => {
			const userId = request.currentUserId;
			if (!userId) {
				return reply.code(401).send({ error: "Unauthorized" });
			}

			const entry = await entryService.updateEntryTranslations(
				userId,
				request.params.iso,
				request.params.id,
				request.body,
			);
			return reply.code(200).send(toEntryViewModel(entry));
		},
	);

	routes.get("/:id", { schema: getEntrySchema }, async (request, reply) => {
		const userId = request.currentUserId;
		if (!userId) {
			return reply.code(401).send({ error: "Unauthorized" });
		}

		const entry = await entryService.getEntry(userId, request.params.id);
		return reply.code(200).send(toEntryViewModel(entry));
	});
};
