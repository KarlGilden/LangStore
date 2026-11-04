import type { User } from "../entities/user.entity.js";

export interface UserRepository {
	findByProviderId(providerId: string): Promise<User | null>;

	create(input: {
		providerId: string;
		username: string | null;
		email: string;
	}): Promise<User | null>;
}
