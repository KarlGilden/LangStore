import type { ClerkClient } from "@clerk/fastify";
import type { IdentityProfileReader } from "../../core/port/identityProfileReader.js";

export const createClerkAdapter = (
	clerkClient: ClerkClient,
): IdentityProfileReader => {
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
