import type { User } from "../../core/entities/user.entity.js";
import type { UserViewModel } from "@langstore/contracts";

export function toUserViewModel(user: User): UserViewModel {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		createdAt: user.createdAt.toISOString(),
	};
}
