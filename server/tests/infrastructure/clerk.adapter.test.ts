import type { ClerkClient } from "@clerk/fastify";
import { describe, expect, it, vi } from "vitest";
import { createClerkAdapter } from "../../src/infrastructure/auth/clerk.adapter.js";

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
		const clerkClient = { users: { getUser } } as unknown as ClerkClient;
		const reader = createClerkAdapter(clerkClient);

		await expect(reader.getUserProfile("provider_user")).resolves.toEqual({
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
		const clerkClient = { users: { getUser } } as unknown as ClerkClient;
		const reader = createClerkAdapter(clerkClient);

		await expect(reader.getUserProfile("provider_user")).resolves.toBeNull();
	});
});
