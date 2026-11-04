import { eq } from "drizzle-orm";
import type { Database } from "../data/db.js";
import { users } from "../data/schema.js";
import type { UserRepository } from "../../core/repositories/user.repository.js";
import { toDomainUser } from "../data/mappers/user.mapper.js";
import { UserEmailConflictError } from "../../core/errors/user.error.js";

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

	const create: UserRepository["create"] = async (input) => {
		try {
			const [row] = await db
				.insert(users)
				.values(input)
				.onConflictDoNothing({ target: users.providerId })
				.returning();

			if (!row) {
				return null;
			}

			return toDomainUser(row);
		} catch (error) {
			if (
				typeof error === "object" &&
				error !== null &&
				"code" in error &&
				error.code === "23505" &&
				"constraint" in error &&
				error.constraint === "users_email_unique"
			) {
				throw new UserEmailConflictError();
			}

			throw error;
		}
	};

	return {
		findByProviderId,
		create,
	};
}
