import type { User } from "../../../core/entities/user.entity.js";
import type { UserRow } from "../schema.js";

export function toDomainUser(row: UserRow): User {
	return {
		id: row.id,
		providerId: row.providerId,
		username: row.username,
		email: row.email,
		createdAt: row.createdAt,
	};
}
