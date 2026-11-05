import type { Page } from "../../../core/entities/page.entity.js";
import type { PageRow } from "../schema.js";

export function toDomainPage(row: PageRow): Page {
	return {
		id: row.id,
		userId: row.userId,
		collectionId: row.collectionId,
		name: row.name,
		description: row.description,
		summary: row.summary,
		createdAt: row.createdAt,
	};
}
