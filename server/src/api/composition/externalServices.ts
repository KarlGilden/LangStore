import { createClerkAdapter } from "../../infrastructure/auth/clerk.adapter.js";
import { createGoogleTextRecognitionProvider } from "../../infrastructure/ocr/google-text-recognition.provider.js";
import type { AppConfig } from "../config.js";

export function createExternalServices(config: AppConfig) {
	return {
		textRecognitionService: createGoogleTextRecognitionProvider({
			projectId: config.GOOGLE_CLOUD_PROJECT_ID,
			location: config.GOOGLE_CLOUD_LOCATION,
			processorId: config.GOOGLE_CLOUD_PROCESSOR_ID,
			credentials: config.GOOGLE_APPLICATION_CREDENTIALS,
		}),
		identityProfileService: createClerkAdapter({
			publishableKey: config.CLERK_PUBLISHABLE_KEY,
			secretKey: config.CLERK_SECRET_KEY,
		}),
	};
}

export type ExternalServices = ReturnType<typeof createExternalServices>;
