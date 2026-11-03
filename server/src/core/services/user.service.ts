import type { UserRepository } from "../repositories/user.repository.js";

export const createUserService = (userRepository: UserRepository) => {
	const findByProviderId = async (providerId: string) => {
		return userRepository.findByProviderId(providerId);
	};

	const createUser = async (user: { providerId: string; email: string }) => {
		return userRepository.create(user);
	};

	return {
		findByProviderId,
		createUser,
	};
};

export type UserService = ReturnType<typeof createUserService>;
