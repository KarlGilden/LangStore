import type { IdentityProfileReader } from "../port/identityProfileReader.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { MissingIdentityEmailError } from "../errors/identity-profile.error.js";

export const createUserService = (
	userRepository: UserRepository,
	identityProfileReader: IdentityProfileReader,
) => {
	const getOrCreateUser = async (providerId: string) => {
		let user = await userRepository.findByProviderId(providerId);

		if (!user) {
			const email = await identityProfileReader.getUserEmail(providerId);

			if (!email) {
				throw new MissingIdentityEmailError();
			}

			user = await userRepository.create({
				providerId: providerId,
				email,
			});

			if (!user) {
				throw new Error("Failed to create existing user");
			}
		}

		return user;
	};

	return {
		getOrCreateUser,
	};
};

export type UserService = ReturnType<typeof createUserService>;
