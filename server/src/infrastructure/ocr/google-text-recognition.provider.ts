import type { TextRecognitionProvider } from "../../core/port/text-recognition.provider.js";
import {
	EmptyRecognizedTextError,
	TextRecognitionFailedError,
} from "../../core/errors/page-ingestion.error.js";

interface GoogleTextAnnotationResponse {
	responses?: Array<{
		fullTextAnnotation?: { text?: string | null } | null;
		error?: { code?: number | null; message?: string | null } | null;
	} | null> | null;
}

export interface GoogleVisionDocumentTextClient {
	batchAnnotateImages(
		request: {
			requests: Array<{
				image: { content: Uint8Array };
				features: Array<{ type: "DOCUMENT_TEXT_DETECTION" }>;
			}>;
		},
		options: { timeout: number },
	): Promise<[GoogleTextAnnotationResponse, ...unknown[]]>;
}

export function createGoogleTextRecognitionProvider(
	client: GoogleVisionDocumentTextClient,
	timeoutMs = 15_000,
): TextRecognitionProvider {
	return {
		async recognizeText(input) {
			try {
				const [batch] = await client.batchAnnotateImages(
					{
						requests: [{
							image: { content: input.image },
							features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
						}],
					},
					{ timeout: timeoutMs },
				);
				const response = batch.responses?.[0];
				if (response?.error) throw new TextRecognitionFailedError();

				const text = response?.fullTextAnnotation?.text ?? "";
				if (!/\S/u.test(text)) throw new EmptyRecognizedTextError();
				return { text };
			} catch (error) {
				if (
					error instanceof EmptyRecognizedTextError ||
					error instanceof TextRecognitionFailedError
				) {
					throw error;
				}
				throw new TextRecognitionFailedError();
			}
		},
	};
}
