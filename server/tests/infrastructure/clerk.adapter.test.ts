import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClerkAdapter } from "../../src/infrastructure/auth/clerk.adapter.js";

const clerkMocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	getUser: vi.fn(),
}));

vi.mock("@clerk/fastify", () => ({
	createClerkClient: clerkMocks.createClient,
}));

const config = {
	publishableKey: "pk_test_example",
	secretKey: "sk_test_example",
};

describe("Clerk identity profile adapter", () => {
	beforeEach(() => {
		clerkMocks.createClient.mockReset();
		clerkMocks.getUser.mockReset();
		clerkMocks.createClient.mockReturnValue({
			users: { getUser: clerkMocks.getUser },
		});
	});

	it("constructs Clerk from configuration and maps the primary identity", async () => {
		clerkMocks.getUser.mockResolvedValue({
			username: "reader",
			primaryEmailAddressId: "primary",
			emailAddresses: [
				{ id: "secondary", emailAddress: "other@example.com" },
				{ id: "primary", emailAddress: "reader@example.com" },
			],
		});
		const provider = createClerkAdapter(config);

		await expect(provider.getUserProfile("provider_user")).resolves.toEqual({
			username: "reader",
			email: "reader@example.com",
		});
		expect(clerkMocks.createClient).toHaveBeenCalledWith(config);
	});

	it("returns null when the provider has no primary email", async () => {
		clerkMocks.getUser.mockResolvedValue({
			username: null,
			primaryEmailAddressId: null,
			emailAddresses: [],
		});
		const provider = createClerkAdapter(config);

		await expect(provider.getUserProfile("provider_user")).resolves.toBeNull();
	});
});
