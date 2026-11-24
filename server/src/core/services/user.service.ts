import type { IdentityProfileService } from "../port/identityProfile.provider.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { MissingIdentityEmailError } from "../errors/identity-profile.error.js";
import { NotFoundError } from "../errors/common.error.js";

export type UserServiceDependencies = {
	userRepository: UserRepository;
	identityProfileService: IdentityProfileService;
};

export const createUserService = ({
	userRepository,
	identityProfileService,
}: UserServiceDependencies) => {
	const getUserById = async (userId: string) => {
		const user = await userRepository.getById(userId);

		if (!user) {
			throw new NotFoundError("User not found");
		}

		return user;
	};

	const getOrCreateUser = async (providerId: string) => {
		let user = await userRepository.getByProviderId(providerId);

		if (!user) {
			const profile = await identityProfileService.getUserProfile(providerId);

			if (!profile) {
				throw new MissingIdentityEmailError();
			}

			user = await userRepository.create({
				providerId,
				username: profile.username,
				email: profile.email.trim().toLowerCase(),
			});

			if (!user) {
				user = await userRepository.getByProviderId(providerId);
			}

			if (!user) {
				throw new Error("Failed to create user");
			}
		}

		return user;
	};

	return {
		getOrCreateUser,
		getUserById,
	};
};

export type UserService = ReturnType<typeof createUserService>;
