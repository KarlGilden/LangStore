import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { createPageIngestionRoutes } from "../../src/api/routes/protected/page-ingestion.route.js";
import { TextRecognitionFailedError } from "../../src/core/errors/page-ingestion.error.js";
import type { PageIngestionService } from "../../src/core/services/page-ingestion.service.js";

const collectionId = "07572e8b-ad66-4e7c-bd42-cea9097fd142";
const page = {
	id: "d6b3df44-bfd1-4ac6-9e7c-6d828a235f0c",
	userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	collectionId,
	name: "Page 1",
	description: null,
	summary: "Haus",
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
};

interface MultipartPart {
	name: string;
	value: string | Buffer;
	filename?: string;
	contentType?: string;
}

function multipartPayload(parts: MultipartPart[]) {
	const boundary = "langstore-test-boundary";
	const chunks: Buffer[] = [];
	for (const part of parts) {
		chunks.push(Buffer.from(`--${boundary}\r\n`));
		const disposition = part.filename
			? `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n`
			: `Content-Disposition: form-data; name="${part.name}"\r\n`;
		chunks.push(Buffer.from(disposition));
		if (part.contentType) chunks.push(Buffer.from(`Content-Type: ${part.contentType}\r\n`));
		chunks.push(Buffer.from("\r\n"));
		chunks.push(typeof part.value === "string" ? Buffer.from(part.value) : part.value);
		chunks.push(Buffer.from("\r\n"));
	}
	chunks.push(Buffer.from(`--${boundary}--\r\n`));
	return {
		payload: Buffer.concat(chunks),
		headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
	};
}

function pngFixture(): Buffer {
	return Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
		"base64",
	);
}

function jpegFixture(size?: number): Buffer {
	const prefix = Buffer.from([
		0xff, 0xd8,
		0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
		0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
	]);
	const targetSize = size ?? prefix.length + 3;
	const bytes = Buffer.alloc(targetSize);
	prefix.copy(bytes);
	bytes[targetSize - 2] = 0xff;
	bytes[targetSize - 1] = 0xd9;
	return bytes;
}

describe("page ingestion route", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	function createApp(options?: {
		authenticated?: boolean;
		pageIngestionService?: PageIngestionService;
		loggerStream?: { write(message: string): void };
	}) {
		const ingestPage = vi.fn().mockImplementation(async (input) => ({
			page: { ...page, name: input.name, description: input.description },
			suggestions: [],
		}));
		const pageIngestionService = options?.pageIngestionService ?? ({ ingestPage } as PageIngestionService);
		const app = Fastify(options?.loggerStream
			? { logger: { stream: options.loggerStream } }
			: {});
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		if (options?.authenticated !== false) {
			app.addHook("preHandler", async (request) => {
				request.authenticatedUserId = "provider_authenticated";
			});
		}
		app.setErrorHandler(errorHandler);
		app.register(multipart);
		app.register(createPageIngestionRoutes(pageIngestionService), {
			prefix: "/api/:iso/collection",
		});
		return { app, ingestPage };
	}

	it.each([
		["PNG", pngFixture(), "image/png"],
		["JPEG", jpegFixture(), "image/jpeg"],
	] as const)("passes a validated %s upload to the coordinator", async (_label, photo, mediaType) => {
		let receivedPhoto: Buffer | undefined;
		const ingestPage = vi.fn().mockImplementation(async (input) => {
			receivedPhoto = Buffer.from(input.photo.bytes);
			return { page, suggestions: [] };
		});
		const { app } = createApp({ pageIngestionService: { ingestPage } });
		const upload = multipartPayload([
			{ name: "name", value: "Page 1" },
			{ name: "description", value: "Opening page" },
			{ name: "photo", value: photo, filename: "page", contentType: mediaType },
		]);

		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...upload,
		});

		expect(response.statusCode).toBe(201);
		expect(receivedPhoto).toEqual(photo);
		expect(ingestPage).toHaveBeenCalledWith(expect.objectContaining({
			providerId: "provider_authenticated",
			iso: "de",
			collectionId,
			name: "Page 1",
			description: "Opening page",
			photo: expect.objectContaining({ mediaType }),
		}));
	});

	it.each([
		["missing photo", [{ name: "name", value: "Page 1" }]],
		["missing name", [
			{ name: "photo", value: pngFixture(), filename: "page.png", contentType: "image/png" },
		]],
		["unsupported content", [
			{ name: "name", value: "Page 1" },
			{ name: "photo", value: Buffer.from("not an image"), filename: "page.gif", contentType: "image/gif" },
		]],
		["spoofed media type", [
			{ name: "name", value: "Page 1" },
			{ name: "photo", value: pngFixture(), filename: "page.jpg", contentType: "image/jpeg" },
		]],
		["malformed image", [
			{ name: "name", value: "Page 1" },
			{ name: "photo", value: Buffer.from([0x89, 0x50, 0x4e, 0x47]), filename: "page.png", contentType: "image/png" },
		]],
		["multiple photos", [
			{ name: "name", value: "Page 1" },
			{ name: "photo", value: pngFixture(), filename: "one.png", contentType: "image/png" },
			{ name: "photo", value: pngFixture(), filename: "two.png", contentType: "image/png" },
		]],
	] as const)("rejects %s before calling the coordinator", async (_label, parts) => {
		const { app, ingestPage } = createApp();
		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...multipartPayload([...parts]),
		});

		expect(response.statusCode).toBe(400);
		expect(ingestPage).not.toHaveBeenCalled();
	});

	it("accepts exactly 10,000,000 bytes", async () => {
		const { app, ingestPage } = createApp();
		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...multipartPayload([
				{ name: "name", value: "Page 1" },
				{ name: "photo", value: jpegFixture(10_000_000), filename: "page.jpg", contentType: "image/jpeg" },
			]),
		});

		expect(response.statusCode).toBe(201);
		expect(ingestPage).toHaveBeenCalledOnce();
	});

	it("rejects 10,000,001 bytes while reading the upload", async () => {
		const { app, ingestPage } = createApp();
		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...multipartPayload([
				{ name: "name", value: "Page 1" },
				{ name: "photo", value: jpegFixture(10_000_001), filename: "page.jpg", contentType: "image/jpeg" },
			]),
		});

		expect(response.statusCode).toBe(413);
		expect(response.json().error.code).toBe("PAGE_UPLOAD_TOO_LARGE");
		expect(ingestPage).not.toHaveBeenCalled();
	});

	it("does not call the service for an unauthenticated request", async () => {
		const { app, ingestPage } = createApp({ authenticated: false });
		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...multipartPayload([
				{ name: "name", value: "Page 1" },
				{ name: "photo", value: pngFixture(), filename: "page.png", contentType: "image/png" },
			]),
		});

		expect(response.statusCode).toBe(401);
		expect(ingestPage).not.toHaveBeenCalled();
	});

	it("returns a safe OCR failure without logging image or recognized-text content", async () => {
		const imageSentinel = "PRIVATE_IMAGE_SENTINEL";
		const textSentinel = "PRIVATE_OCR_TEXT_SENTINEL";
		const photo = jpegFixture(256);
		photo.write(imageSentinel, 32, "ascii");
		const logs: string[] = [];
		const ingestPage = vi.fn().mockRejectedValue(new TextRecognitionFailedError());
		const { app } = createApp({
			pageIngestionService: { ingestPage },
			loggerStream: { write: (message) => logs.push(message) },
		});

		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${collectionId}/page-ingestions`,
			...multipartPayload([
				{ name: "name", value: "Page 1" },
				{ name: "description", value: textSentinel },
				{ name: "photo", value: photo, filename: "page.jpg", contentType: "image/jpeg" },
			]),
		});

		expect(response.statusCode).toBe(502);
		expect(response.json().error).toEqual({
			code: "TEXT_RECOGNITION_FAILED",
			message: "Text recognition is temporarily unavailable",
		});
		const output = `${response.body}\n${logs.join("\n")}`;
		expect(output).not.toContain(imageSentinel);
		expect(output).not.toContain(textSentinel);
	});
});
