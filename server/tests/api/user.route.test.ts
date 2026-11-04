import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createUserRoutes } from "../../src/api/routes/protected/user.route.js";
import type { UserService } from "../../src/core/services/user.service.js";
import type { UserSettingsService } from "../../src/core/services/user-settings.service.js";

describe("GET /api/user", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	it("uses the authenticated provider identity and returns the public user view", async () => {
		const getOrCreateUser = vi.fn().mockResolvedValue({
			id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
			providerId: "provider_authenticated",
			username: "reader",
			email: "reader@example.com",
			createdAt: new Date("2026-11-04T12:00:00.000Z"),
		});
		const userService = { getOrCreateUser } as UserService;
		const app = Fastify();
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		app.addHook("preHandler", async (request) => {
			request.authenticatedUserId = "provider_authenticated";
		});
		app.register(
			createUserRoutes(userService, {} as UserSettingsService),
			{ prefix: "/api" },
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/user?userId=provider_attacker",
		});

		expect(response.statusCode).toBe(200);
		expect(getOrCreateUser).toHaveBeenCalledWith("provider_authenticated");
		expect(response.json()).toEqual({
			id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
			username: "reader",
			email: "reader@example.com",
			createdAt: "2026-11-04T12:00:00.000Z",
		});
	});
});
