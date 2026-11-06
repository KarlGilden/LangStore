import { describe, expect, it, vi } from "vitest";
import { createClerkAdapter } from "../../src/infrastructure/auth/clerk.adapter.js";

const config = {
	publishableKey: "pk_test_example",
	secretKey: "sk_test_example",
};

describe("Clerk identity profile adapter", () => {
	it("maps the provider username and primary email", async () => {
		const getUser = vi.fn().mockResolvedValue({
			username: "reader",
			primaryEmailAddressId: "primary",
			emailAddresses: [
				{ id: "secondary", emailAddress: "other@example.com" },
				{ id: "primary", emailAddress: "reader@example.com" },
			],
		});
		const clerkClient = { users: { getUser } };
		const provider = createClerkAdapter(config, clerkClient);

		await expect(provider.getUserProfile("provider_user")).resolves.toEqual({
			username: "reader",
			email: "reader@example.com",
		});
	});

	it("returns null when the provider has no primary email", async () => {
		const getUser = vi.fn().mockResolvedValue({
			username: null,
			primaryEmailAddressId: null,
			emailAddresses: [],
		});
		const clerkClient = { users: { getUser } };
		const provider = createClerkAdapter(config, clerkClient);

		await expect(provider.getUserProfile("provider_user")).resolves.toBeNull();
	});
});
