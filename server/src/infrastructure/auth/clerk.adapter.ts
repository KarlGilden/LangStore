import type { ClerkClient } from "@clerk/fastify";
import type { AuthClient } from "../../api/auth/authClient.js";

export const clerkAdapter = (clerkClient: ClerkClient): AuthClient => {
	return {
		getUserEmail: async (userId: string) => {
			const clerkUser = await clerkClient.users.getUser(userId);

			const email = clerkUser.emailAddresses.find(
				(address) => address.id === clerkUser.primaryEmailAddressId,
			)?.emailAddress;

			if (!email) {
				throw new Error("User has no email address");
			}

			return email;
		},
	};
};
