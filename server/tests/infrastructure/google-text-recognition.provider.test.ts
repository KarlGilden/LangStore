import { describe, expect, it, vi } from "vitest";
import {
	createGoogleTextRecognitionProvider,
	type GoogleDocumentAIClient,
} from "../../src/infrastructure/ocr/google-text-recognition.provider.js";

const config = {
	projectId: "test-project",
	location: "eu",
	processorId: "test-processor",
	credentials: Buffer.from(JSON.stringify({
		client_email: "test@example.com",
		private_key: "test-key",
	})).toString("base64"),
};

function createClient(text: string | null | undefined): GoogleDocumentAIClient {
	return {
		processDocument: vi.fn().mockResolvedValue([{
			document: text === undefined ? undefined : { text },
		}]),
		close: vi.fn().mockResolvedValue(undefined),
	};
}

describe("Google text recognition provider", () => {
	it("sends the page to Document AI and returns normalized recognized text", async () => {
		const client = createClient(" Haus, Haus!\n ");
		const provider = createGoogleTextRecognitionProvider(config, client);

		await expect(provider.recognizeText({
			image: new Uint8Array([1, 2, 3]),
			mediaType: "image/png",
		})).resolves.toEqual({ text: "Haus, Haus!" });
		expect(client.processDocument).toHaveBeenCalledWith({
			name: "projects/test-project/locations/eu/processors/test-processor",
			rawDocument: {
				content: new Uint8Array([1, 2, 3]),
				mimeType: "image/png",
			},
		});
	});

	it.each([
		["missing text", undefined],
		["null text", null],
		["whitespace text", " \n"],
	] as const)("maps %s to the new validation contract", async (_label, text) => {
		const provider = createGoogleTextRecognitionProvider(config, createClient(text));

		await expect(provider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/png",
		})).rejects.toMatchObject({
			name: "ValidationError",
			message: "No readable text was found in the image.",
		});
	});

	it("maps provider failures to the new service-unavailable contract", async () => {
		const client = createClient("unused");
		vi.mocked(client.processDocument).mockRejectedValue(
			new Error("deadline exceeded with credentials"),
		);
		const provider = createGoogleTextRecognitionProvider(config, client);

		await expect(provider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/jpeg",
		})).rejects.toMatchObject({
			name: "ServiceUnavailableError",
			message: "The text recognition service could not process the image.",
		});
	});

	it("closes the Document AI client", async () => {
		const client = createClient("Haus");
		const provider = createGoogleTextRecognitionProvider(config, client);

		await provider.close();

		expect(client.close).toHaveBeenCalledOnce();
	});
});
