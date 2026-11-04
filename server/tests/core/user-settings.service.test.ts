import { describe, expect, it, vi } from "vitest";
import type { UserSettingsRepository } from "../../src/core/repositories/user-settings.repository.js";
import { createUserSettingsService } from "../../src/core/services/user-settings.service.js";
import type { UserService } from "../../src/core/services/user.service.js";

const user = {
	id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	providerId: "provider_authenticated",
	username: null,
	email: "reader@example.com",
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

function createDependencies() {
	const userSettingsRepository: UserSettingsRepository = {
		findByUserId: vi.fn(),
		upsert: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;

	return { userSettingsRepository, userService };
}

describe("UserSettingsService", () => {
	it("reads settings using the internal user resolved from the authenticated provider", async () => {
		const { userSettingsRepository, userService } = createDependencies();
		vi.mocked(userSettingsRepository.findByUserId).mockResolvedValue({
			userId: user.id,
			targetLanguage: "de",
			userLanguage: "en",
		});
		const service = createUserSettingsService(userSettingsRepository, userService);

		await service.getSettings("provider_authenticated");

		expect(userService.getOrCreateUser).toHaveBeenCalledWith("provider_authenticated");
		expect(userSettingsRepository.findByUserId).toHaveBeenCalledWith(user.id);
	});

	it("returns not found when the authenticated user has no settings", async () => {
		const { userSettingsRepository, userService } = createDependencies();
		vi.mocked(userSettingsRepository.findByUserId).mockResolvedValue(null);
		const service = createUserSettingsService(userSettingsRepository, userService);

		await expect(service.getSettings("provider_authenticated")).rejects.toMatchObject({
			name: "SettingsNotFoundError",
		});
	});

	it.each([
		["targetLanguage", { targetLanguage: "zz", userLanguage: "en" }],
		["targetLanguage", { targetLanguage: "DE", userLanguage: "en" }],
		["userLanguage", { targetLanguage: "de", userLanguage: "xx" }],
		["userLanguage", { targetLanguage: "de", userLanguage: "eng" }],
	] as const)("rejects an invalid %s", async (field, input) => {
		const { userSettingsRepository, userService } = createDependencies();
		const service = createUserSettingsService(userSettingsRepository, userService);

		await expect(
			service.replaceSettings("provider_authenticated", input),
		).rejects.toMatchObject({ name: "InvalidLanguageCodeError", field });
		expect(userService.getOrCreateUser).not.toHaveBeenCalled();
		expect(userSettingsRepository.upsert).not.toHaveBeenCalled();
	});

	it("creates or replaces valid settings for the authenticated user", async () => {
		const { userSettingsRepository, userService } = createDependencies();
		vi.mocked(userSettingsRepository.upsert).mockImplementation(async (input) => input);
		const service = createUserSettingsService(userSettingsRepository, userService);

		await expect(
			service.replaceSettings("provider_authenticated", {
				targetLanguage: "de",
				userLanguage: "en",
			}),
		).resolves.toEqual({
			userId: user.id,
			targetLanguage: "de",
			userLanguage: "en",
		});
		expect(userSettingsRepository.upsert).toHaveBeenCalledWith({
			userId: user.id,
			targetLanguage: "de",
			userLanguage: "en",
		});
	});
});
