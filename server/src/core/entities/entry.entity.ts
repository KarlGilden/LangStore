import type { Translation } from "./translation.entity.js";

export interface Entry {
	id: string;
	text: string;
	userId: string;
	createdAt: Date;
	iso: string;
	translations: Translation[];
}
