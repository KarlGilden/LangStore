import type { Collection } from "../../../core/entities/collection.entity.js";
import type { CollectionRow } from "../schema.js";

export function toDomainCollection(row: CollectionRow): Collection {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		imgUrl: row.imgUrl,
		userId: row.userId,
		iso: row.iso,
	};
}
