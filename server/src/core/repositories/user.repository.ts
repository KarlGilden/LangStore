import type { User } from "../entities/user.entity.js";

export interface UserRepository {
	getByProviderId(providerId: string): Promise<User | null>;

	getById(userId: string): Promise<User | null>;

	create(input: {
		providerId: string;
		username: string | null;
		email: string;
	}): Promise<User | null>;
}
