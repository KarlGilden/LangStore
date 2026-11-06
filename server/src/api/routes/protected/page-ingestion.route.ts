import { randomUUID } from "node:crypto";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
	InvalidPageUploadError,
	PageUploadTooLargeError,
} from "../../../core/errors/page-ingestion.error.js";
import type { PageIngestionService } from "../../../core/services/page-ingestion.service.js";
import { toPageViewModel } from "../../mappers/page.mapper.js";
import {
	createPageIngestionSchema,
	type CollectionPagesParams,
} from "../../schema/page.schema.js";
import {
	MAX_PAGE_PHOTO_BYTES,
	validatePagePhoto,
	type ValidatedPagePhoto,
} from "../../upload/page-photo.js";

interface ParsedPageIngestion {
	name: string;
	description: string | null;
	photo: ValidatedPagePhoto;
}

export function createPageIngestionRoutes(
	pageIngestionService: PageIngestionService,
): FastifyPluginAsync {
	return async (app) => {
		app.post<{ Params: CollectionPagesParams }>(
			"/:collectionId/page-ingestions",
			{ schema: createPageIngestionSchema },
			async (request, reply) => {
				const providerId = request.authenticatedUserId;
				if (!providerId) {
					return reply.code(401).send({ error: "Unauthorized" });
				}

				const input = await readPageIngestionMultipart(request);
				try {
					const result = await pageIngestionService.ingestPage({
						providerId,
						iso: request.params.iso,
						pageId: randomUUID(),
						collectionId: request.params.collectionId,
						name: input.name,
						description: input.description,
						photo: {
							bytes: input.photo.bytes,
							mediaType: input.photo.mediaType,
						},
					});

					return reply.code(201).send({
						page: toPageViewModel(result.page),
						suggestions: result.suggestions,
					});
				} finally {
					input.photo.bytes.fill(0);
				}
			},
		);
	};
}

async function readPageIngestionMultipart(
	request: FastifyRequest,
): Promise<ParsedPageIngestion> {
	if (!request.isMultipart()) {
		throw new InvalidPageUploadError(
			"Content-Type must be multipart/form-data",
		);
	}

	let name: string | undefined;
	let description: string | null | undefined;
	let photo: ValidatedPagePhoto | undefined;

	try {
		for await (const part of request.parts({
			limits: {
				fileSize: MAX_PAGE_PHOTO_BYTES,
				files: 1,
				fields: 2,
				parts: 3,
				fieldSize: 65_536,
			},
		})) {
			if (part.type === "file") {
				if (part.fieldname !== "photo" || photo) {
					throw new InvalidPageUploadError(
						"Exactly one photo file is required",
					);
				}
				const bytes = await part.toBuffer();
				photo = validatePagePhoto(bytes, part.mimetype);
				continue;
			}

			if (part.valueTruncated || typeof part.value !== "string") {
				throw new InvalidPageUploadError("Multipart text fields are invalid");
			}
			if (part.fieldname === "name" && name === undefined) {
				name = part.value;
			} else if (
				part.fieldname === "description" &&
				description === undefined
			) {
				description = part.value;
			} else {
				throw new InvalidPageUploadError(
					"Multipart fields must contain one name and optional description",
				);
			}
		}
	} catch (error) {
		photo?.bytes.fill(0);
		if (isMultipartLimitError(error, "FST_REQ_FILE_TOO_LARGE")) {
			throw new PageUploadTooLargeError();
		}
		if (isMultipartLimitError(error)) {
			throw new InvalidPageUploadError(
				"Multipart upload contains too many fields or files",
			);
		}
		throw error;
	}

	if (!photo)
		throw new InvalidPageUploadError("Exactly one photo file is required");
	if (name === undefined) {
		photo.bytes.fill(0);
		throw new InvalidPageUploadError("The name field is required");
	}
	return { name, description: description ?? null, photo };
}

function isMultipartLimitError(error: unknown, code?: string): boolean {
	if (!(error instanceof Error) || !("code" in error)) return false;
	const errorCode = (error as Error & { code?: unknown }).code;
	if (code) return errorCode === code;
	return (
		typeof errorCode === "string" &&
		[
			"FST_REQ_FILE_TOO_LARGE",
			"FST_FILES_LIMIT",
			"FST_FIELDS_LIMIT",
			"FST_PARTS_LIMIT",
		].includes(errorCode)
	);
}
