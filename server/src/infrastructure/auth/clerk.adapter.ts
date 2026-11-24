import { createClerkClient } from "@clerk/fastify";
import type { IdentityProfileService } from "../../core/port/identityProfile.provider.js";
import type { ExternalService } from "../types.js";

interface ClerkClientConfig {
	publishableKey: string;
	secretKey: string;
}

export const createClerkAdapter = (
	config: ClerkClientConfig,
): ExternalService<IdentityProfileService> => {
	const clerkClient = createClerkClient({
		publishableKey: config.publishableKey,
		secretKey: config.secretKey,
	});

	return {
		service: {
			getUserProfile: async (userId: string) => {
				const clerkUser = await clerkClient.users.getUser(userId);

				const email = clerkUser.emailAddresses.find(
					(address) => address.id === clerkUser.primaryEmailAddressId,
				)?.emailAddress;

				if (!email) {
					return null;
				}

				return {
					username: clerkUser.username,
					email,
				};
			},
		},
		close: async () => {},
	};
};
