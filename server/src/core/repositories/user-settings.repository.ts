import type { UserSettings } from "../entities/user-settings.entity.js";

export interface UserSettingsRepository {
	get(userId: string): Promise<UserSettings | null>;

	upsert(input: UserSettings): Promise<UserSettings>;
}
