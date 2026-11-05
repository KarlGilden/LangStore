import { describe, expect, it, vi } from "vitest";
import { composePageIngestionDependencies } from "../../src/api/app.js";
import type { TextRecognitionProvider } from "../../src/core/port/text-recognition.provider.js";
import type { TranslationProvider } from "../../src/core/port/translation.provider.js";
import type { Database } from "../../src/infrastructure/data/db.js";

describe("page ingestion composition", () => {
	it("substitutes deterministic provider implementations without provider SDKs", async () => {
		const textRecognitionProvider: TextRecognitionProvider = {
			recognizeText: vi.fn().mockResolvedValue({ text: "Haus" }),
		};
		const translationProvider: TranslationProvider = {
			translateTexts: vi.fn().mockResolvedValue([
				{ sourceText: "haus", translatedText: "house" },
			]),
		};
		const dependencies = composePageIngestionDependencies({} as Database, {
			textRecognitionProvider,
			translationProvider,
		});

		await expect(
			dependencies.textRecognitionProvider.recognizeText({
				image: new Uint8Array([0xff, 0xd8, 0xff]),
				mediaType: "image/jpeg",
			}),
		).resolves.toEqual({ text: "Haus" });
		await expect(
			dependencies.translationProvider.translateTexts({
				texts: ["haus"],
				sourceLanguage: "de",
				targetLanguage: "en",
			}),
		).resolves.toEqual([
			{ sourceText: "haus", translatedText: "house" },
		]);
	});
});
