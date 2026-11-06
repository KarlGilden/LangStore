import { createClerkClient, type ClerkClient } from "@clerk/fastify";
import type { IdentityProfileProvider } from "../../core/port/identityProfile.provider.js";

interface ClerkClientConfig {
	publishableKey: string;
	secretKey: string;
}

export const createClerkAdapter = (
	config: ClerkClientConfig,
): IdentityProfileProvider => {
	const clerkClient = createClerkClient({
		publishableKey: config.publishableKey,
		secretKey: config.secretKey,
	});

	return {
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
	};
};
