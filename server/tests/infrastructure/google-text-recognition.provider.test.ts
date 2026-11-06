import { describe, expect, it, vi } from "vitest";
import {
	createGoogleTextRecognitionProvider,
	type GoogleVisionDocumentTextClient,
} from "../../src/infrastructure/ocr/google-text-recognition.provider.js";

function createClient(result: unknown): GoogleVisionDocumentTextClient {
	return {
		batchAnnotateImages: vi.fn().mockResolvedValue([result]),
	};
}

describe("Google text recognition provider", () => {
	it("requests document text detection and returns the original recognized text", async () => {
		const client = createClient({
			responses: [{ fullTextAnnotation: { text: "Haus, Haus!\n" } }],
		});
		const provider = createGoogleTextRecognitionProvider(client, 4_000);

		await expect(provider.recognizeText({
			image: new Uint8Array([1, 2, 3]),
			mediaType: "image/png",
		})).resolves.toEqual({ text: "Haus, Haus!\n" });
		expect(client.batchAnnotateImages).toHaveBeenCalledWith({
			requests: [{
				image: { content: new Uint8Array([1, 2, 3]) },
				features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
			}],
		}, { timeout: 4_000 });
	});

	it.each([
		["missing annotation", { responses: [{}] }],
		["whitespace annotation", { responses: [{ fullTextAnnotation: { text: " \n" } }] }],
	] as const)("maps %s to a safe empty-text error", async (_label, result) => {
		const provider = createGoogleTextRecognitionProvider(createClient(result));
		await expect(provider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/png",
		})).rejects.toMatchObject({
			name: "EmptyRecognizedTextError",
			message: "No readable text was found in the page photo",
		});
	});

	it("maps provider response errors without exposing provider details", async () => {
		const provider = createGoogleTextRecognitionProvider(createClient({
			responses: [{ error: { code: 8, message: "secret provider payload" } }],
		}));
		await expect(provider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/png",
		})).rejects.toMatchObject({
			name: "TextRecognitionFailedError",
			message: "Text recognition is temporarily unavailable",
		});
	});

	it("maps timeouts to the same safe provider error", async () => {
		const client: GoogleVisionDocumentTextClient = {
			batchAnnotateImages: vi.fn().mockRejectedValue(new Error("deadline exceeded with credentials")),
		};
		const provider = createGoogleTextRecognitionProvider(client);
		await expect(provider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/jpeg",
		})).rejects.toMatchObject({
			name: "TextRecognitionFailedError",
			message: "Text recognition is temporarily unavailable",
		});
	});
});
