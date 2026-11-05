import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import type { EntryService } from "../../../core/services/entry.service.js";
import { toEntryViewModel } from "../../mappers/entry.mapper.js";
import {
	createEntrySchema,
	getEntrySchema,
	listEntriesSchema,
	type CreateEntryBody,
	type EntryParams,
} from "../../schema/entry.schema.js";

export function createEntryRoutes(entryService: EntryService): FastifyPluginAsync {
	return async (app) => {
		app.post<{ Body: CreateEntryBody }>(
			"/",
			{ schema: createEntrySchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const entry = await entryService.createEntry(providerId, request.body);
				return reply.code(201).send(toEntryViewModel(entry));
			},
		);

		app.get(
			"/",
			{ schema: listEntriesSchema },
			async (request: FastifyRequest, reply: FastifyReply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const entries = await entryService.listEntries(providerId);
				return reply.code(200).send(entries.map(toEntryViewModel));
			},
		);

		app.get<{ Params: EntryParams }>(
			"/:id",
			{ schema: getEntrySchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const entry = await entryService.getEntry(
					providerId,
					request.params.id,
				);
				return reply.code(200).send(toEntryViewModel(entry));
			},
		);
	};
}
