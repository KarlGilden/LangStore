import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGoogleTextRecognitionProvider } from "../../src/infrastructure/ocr/google-text-recognition.provider.js";

const documentAIMocks = vi.hoisted(() => ({
	close: vi.fn(),
	createClient: vi.fn(),
	processDocument: vi.fn(),
}));

vi.mock("@google-cloud/documentai", () => ({
	DocumentProcessorServiceClient: documentAIMocks.createClient,
}));

const credentials = {
	client_email: "test@example.com",
	private_key: "test-key",
};
const config = {
	projectId: "test-project",
	location: "eu",
	processorId: "test-processor",
	credentials: Buffer.from(JSON.stringify(credentials)).toString("base64"),
};

describe("Google text recognition provider", () => {
	beforeEach(() => {
		documentAIMocks.close.mockReset().mockResolvedValue(undefined);
		documentAIMocks.createClient.mockReset().mockImplementation(class {
			close = documentAIMocks.close;
			processDocument = documentAIMocks.processDocument;
		});
		documentAIMocks.processDocument.mockReset();
	});

	it("constructs Document AI and returns normalized recognized text", async () => {
		documentAIMocks.processDocument.mockResolvedValue([{
			document: { text: " Haus, Haus!\n " },
		}]);
		const { textRecognitionProvider } = createGoogleTextRecognitionProvider(config);

		await expect(textRecognitionProvider.recognizeText({
			image: new Uint8Array([1, 2, 3]),
			mediaType: "image/png",
		})).resolves.toEqual({ text: "Haus, Haus!" });
		expect(documentAIMocks.createClient).toHaveBeenCalledWith({
			apiEndpoint: "eu-documentai.googleapis.com",
			credentials,
		});
		expect(documentAIMocks.processDocument).toHaveBeenCalledWith({
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
	] as const)("maps %s to the validation contract", async (_label, text) => {
		documentAIMocks.processDocument.mockResolvedValue([{
			document: text === undefined ? undefined : { text },
		}]);
		const { textRecognitionProvider } = createGoogleTextRecognitionProvider(config);

		await expect(textRecognitionProvider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/png",
		})).rejects.toMatchObject({
			name: "ValidationError",
			message: "No readable text was found in the image.",
		});
	});

	it("maps provider failures without exposing provider details", async () => {
		documentAIMocks.processDocument.mockRejectedValue(
			new Error("deadline exceeded with credentials"),
		);
		const { textRecognitionProvider } = createGoogleTextRecognitionProvider(config);

		await expect(textRecognitionProvider.recognizeText({
			image: new Uint8Array([1]),
			mediaType: "image/jpeg",
		})).rejects.toMatchObject({
			name: "ServiceUnavailableError",
			message: "The text recognition service could not process the image.",
		});
	});

	it("exposes infrastructure cleanup separately from the core provider", async () => {
		const { close, textRecognitionProvider } =
			createGoogleTextRecognitionProvider(config);

		expect(textRecognitionProvider).not.toHaveProperty("close");
		await close();

		expect(documentAIMocks.close).toHaveBeenCalledOnce();
	});
});
