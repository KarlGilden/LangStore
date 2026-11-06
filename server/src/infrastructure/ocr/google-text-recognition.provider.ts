import type {
	TextRecognitionProvider,
	TextRecognitionResult,
} from "../../core/port/text-recognition.provider.js";
import { ServiceUnavailableError } from "../../core/errors/service.error.js";
import { ValidationError } from "../../core/errors/validation.error.js";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

export interface GoogleDocumentAIClientConfig {
	projectId: string;
	location: string;
	processorId: string;
	credentials: string;
}

export interface GoogleDocumentAIClient {
	processDocument(request: {
		name: string;
		rawDocument: {
			content: Uint8Array;
			mimeType: string;
		};
	}): Promise<
		[
			{
				document?: { text?: string | null } | null;
			},
			...unknown[],
		]
	>;
	close(): Promise<void>;
}

export function createGoogleDocumentAIClient(
	config: GoogleDocumentAIClientConfig,
): GoogleDocumentAIClient {
	const credentialsJsonString = Buffer.from(
		config.credentials,
		"base64",
	).toString("utf-8");

	const credentialsObject = JSON.parse(credentialsJsonString);

	return new DocumentProcessorServiceClient({
		apiEndpoint: `${config.location}-documentai.googleapis.com`,
		credentials: credentialsObject,
	});
}

export function createGoogleTextRecognitionProvider(
	config: GoogleDocumentAIClientConfig,
): {
	textRecognitionProvider: TextRecognitionProvider;
	close: () => Promise<void>;
} {
	const client = createGoogleDocumentAIClient(config);
	const processorName = `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;

	return {
		textRecognitionProvider: {
			recognizeText: async (input) => {
				let text: string | null | undefined;

				try {
					const [result] = await client.processDocument({
						name: processorName,
						rawDocument: {
							content: input.image,
							mimeType: input.mediaType,
						},
					});

					text = result.document?.text;
				} catch {
					throw new ServiceUnavailableError(
						"The text recognition service could not process the image.",
					);
				}

				if (!text?.trim()) {
					throw new ValidationError("No readable text was found in the image.");
				}

				const response: TextRecognitionResult = {
					text: text.trim(),
				};

				return response;
			},
		},
		close: async () => {
			await client.close();
		},
	};
}
