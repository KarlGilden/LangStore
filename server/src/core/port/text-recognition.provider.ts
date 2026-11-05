export interface TextRecognitionInput {
	image: Uint8Array;
	mediaType: string;
}

export interface TextRecognitionResult {
	text: string;
}

/** Provider-neutral boundary for OCR implementations. */
export interface TextRecognitionProvider {
	recognizeText(input: TextRecognitionInput): Promise<TextRecognitionResult>;
}
