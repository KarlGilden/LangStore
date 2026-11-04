import { describe, expect, it, vi } from "vitest";
import type { User } from "../../src/core/entities/user.entity.js";
import type { IdentityProfileReader } from "../../src/core/port/identityProfileReader.js";
import type { UserRepository } from "../../src/core/repositories/user.repository.js";
import { createUserService } from "../../src/core/services/user.service.js";

const existingUser: User = {
	id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	providerId: "provider_existing",
	username: "reader",
	email: "reader@example.com",
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

function createDependencies() {
	const userRepository: UserRepository = {
		findByProviderId: vi.fn(),
		create: vi.fn(),
	};
	const identityProfileReader: IdentityProfileReader = {
		getUserProfile: vi.fn(),
	};

	return { userRepository, identityProfileReader };
}

describe("UserService.getOrCreateUser", () => {
	it("returns an existing user without reading the provider profile", async () => {
		const { userRepository, identityProfileReader } = createDependencies();
		vi.mocked(userRepository.findByProviderId).mockResolvedValue(existingUser);
		const service = createUserService(userRepository, identityProfileReader);

		await expect(service.getOrCreateUser("provider_existing")).resolves.toBe(
			existingUser,
		);
		expect(identityProfileReader.getUserProfile).not.toHaveBeenCalled();
	});

	it("provisions a user from a normalized provider profile", async () => {
		const { userRepository, identityProfileReader } = createDependencies();
		vi.mocked(userRepository.findByProviderId).mockResolvedValue(null);
		vi.mocked(identityProfileReader.getUserProfile).mockResolvedValue({
			username: null,
			email: "  LEARNER@Example.COM ",
		});
		vi.mocked(userRepository.create).mockResolvedValue({
			...existingUser,
			providerId: "provider_new",
			username: null,
			email: "learner@example.com",
		});
		const service = createUserService(userRepository, identityProfileReader);

		const user = await service.getOrCreateUser("provider_new");

		expect(user.email).toBe("learner@example.com");
		expect(userRepository.create).toHaveBeenCalledWith({
			providerId: "provider_new",
			username: null,
			email: "learner@example.com",
		});
	});

	it("returns the concurrently-created provider identity", async () => {
		const { userRepository, identityProfileReader } = createDependencies();
		vi.mocked(userRepository.findByProviderId)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(existingUser);
		vi.mocked(identityProfileReader.getUserProfile).mockResolvedValue({
			username: "reader",
			email: "reader@example.com",
		});
		vi.mocked(userRepository.create).mockResolvedValue(null);
		const service = createUserService(userRepository, identityProfileReader);

		await expect(service.getOrCreateUser("provider_existing")).resolves.toBe(
			existingUser,
		);
		expect(userRepository.findByProviderId).toHaveBeenCalledTimes(2);
	});
});
