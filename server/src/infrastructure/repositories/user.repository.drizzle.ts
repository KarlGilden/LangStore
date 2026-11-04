import { eq } from "drizzle-orm";
import type { Database } from "../data/db.js";
import { users } from "../data/schema.js";
import type { UserRepository } from "../../core/repositories/user.repository.js";
import { toDomainUser } from "../data/mappers/user.mapper.js";

export function createDrizzleUserRepository(db: Database): UserRepository {
	const findByProviderId = async (providerId: string) => {
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.providerId, providerId))
			.limit(1);

		if (!row) {
			return null;
		}

		return toDomainUser(row);
	};

	const create = async (input: { providerId: string; email: string }) => {
		const [row] = await db.insert(users).values(input).returning();

		if (!row) {
			return null;
		}

		return toDomainUser(row);
	};

	return {
		findByProviderId,
		create,
	};
}
