import type { UserRow } from "../../infrastructure/data/schema.js";
import type { User } from "../entities/user.entity.js";

export interface UserRepository {
	findByProviderId(providerId: string): Promise<User | null>;

	create(input: { providerId: string; email: string }): Promise<User | null>;
}
