import type { Entry } from "../entities/entry.entity.js";

export interface CreateEntryInput {
	text: string;
	userId: string;
	iso: string;
	translations: { text: string }[];
}

export interface EntryRepository {
	create(input: CreateEntryInput): Promise<Entry>;

	findByIdForUser(id: string, userId: string): Promise<Entry | null>;

	listByUserAndIso(userId: string, iso: string): Promise<Entry[]>;
}
