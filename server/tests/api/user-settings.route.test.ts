import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { createUserRoutes } from "../../src/api/routes/protected/user.route.js";
import { InvalidLanguageCodeError, SettingsNotFoundError } from "../../src/core/errors/user-settings.error.js";
import type { UserSettingsService } from "../../src/core/services/user-settings.service.js";
import type { UserService } from "../../src/core/services/user.service.js";

describe("current-user settings routes", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	function createApp(service: UserSettingsService) {
		const app = Fastify();
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		app.addHook("preHandler", async (request) => {
			request.authenticatedUserId = "provider_authenticated";
		});
		app.setErrorHandler(errorHandler);
		app.register(createUserRoutes({} as UserService, service), {
			prefix: "/api/user",
		});
		return app;
	}

	it("reads settings using only the authenticated provider identity", async () => {
		const getSettings = vi.fn().mockResolvedValue({
			userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
			targetLanguage: "de",
			userLanguage: "en",
		});
		const app = createApp({ getSettings } as unknown as UserSettingsService);

		const response = await app.inject({
			method: "GET",
			url: "/api/user/settings?userId=provider_attacker",
		});

		expect(response.statusCode).toBe(200);
		expect(getSettings).toHaveBeenCalledWith("provider_authenticated");
		expect(response.json()).toEqual({ targetLanguage: "de", userLanguage: "en" });
	});

	it("creates or replaces settings for the authenticated identity", async () => {
		const replaceSettings = vi.fn().mockResolvedValue({
			userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
			targetLanguage: "fr",
			userLanguage: "en",
		});
		const app = createApp({ replaceSettings } as unknown as UserSettingsService);

		const response = await app.inject({
			method: "PUT",
			url: "/api/user/settings",
			payload: { targetLanguage: "fr", userLanguage: "en" },
		});

		expect(response.statusCode).toBe(200);
		expect(replaceSettings).toHaveBeenCalledWith("provider_authenticated", {
			targetLanguage: "fr",
			userLanguage: "en",
		});
		expect(response.json()).toEqual({ targetLanguage: "fr", userLanguage: "en" });
	});

	it("discards a submitted user ID before calling the settings service", async () => {
		const replaceSettings = vi.fn().mockResolvedValue({
			userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
			targetLanguage: "fr",
			userLanguage: "en",
		});
		const app = createApp({ replaceSettings } as unknown as UserSettingsService);

		const response = await app.inject({
			method: "PUT",
			url: "/api/user/settings",
			payload: {
				userId: "provider_attacker",
				targetLanguage: "fr",
				userLanguage: "en",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(replaceSettings).toHaveBeenCalledWith("provider_authenticated", {
			targetLanguage: "fr",
			userLanguage: "en",
		});
	});

	it("returns not found when settings do not exist", async () => {
		const getSettings = vi.fn().mockRejectedValue(new SettingsNotFoundError());
		const app = createApp({ getSettings } as unknown as UserSettingsService);

		const response = await app.inject({
			method: "GET",
			url: "/api/user/settings",
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("SETTINGS_NOT_FOUND");
	});

	it.each([
		["DE", new Error("schema validation")],
		["zz", new InvalidLanguageCodeError("targetLanguage")],
	] as const)("rejects invalid target language %s", async (targetLanguage, failure) => {
		const replaceSettings = vi.fn().mockRejectedValue(failure);
		const app = createApp({ replaceSettings } as unknown as UserSettingsService);

		const response = await app.inject({
			method: "PUT",
			url: "/api/user/settings",
			payload: { targetLanguage, userLanguage: "en" },
		});

		expect(response.statusCode).toBe(400);
	});
});
