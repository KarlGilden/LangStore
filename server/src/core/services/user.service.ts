import type { IdentityProfileReader } from "../port/identityProfile.provider.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { MissingIdentityEmailError } from "../errors/identity-profile.error.js";

export const createUserService = (
	userRepository: UserRepository,
	identityProfileReader: IdentityProfileReader,
) => {
	const getOrCreateUser = async (providerId: string) => {
		let user = await userRepository.findByProviderId(providerId);

		if (!user) {
			const profile = await identityProfileReader.getUserProfile(providerId);

			if (!profile) {
				throw new MissingIdentityEmailError();
			}

			user = await userRepository.create({
				providerId,
				username: profile.username,
				email: profile.email.trim().toLowerCase(),
			});

			if (!user) {
				user = await userRepository.findByProviderId(providerId);
			}

			if (!user) {
				throw new Error("Failed to create user");
			}
		}

		return user;
	};

	return {
		getOrCreateUser,
	};
};

export type UserService = ReturnType<typeof createUserService>;
