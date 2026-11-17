import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
	createEntrySchema,
	getEntrySchema,
	listEntriesSchema,
} from "@langstore/contracts";
import type { EntryService } from "../../../core/services/entry.service.js";
import { toEntryViewModel } from "../../mappers/entry.mapper.js";
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";

export function createEntryRoutes(
	entryService: EntryService,
): FastifyPluginAsync {
	return async (app) => {
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
				if (!userId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const entries = await entryService.getAllEntries(userId);
				return reply.code(200).send(entries.map(toEntryViewModel));
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
}
