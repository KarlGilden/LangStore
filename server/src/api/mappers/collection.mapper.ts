import type { Collection } from "../../core/entities/collection.entity.js";
import type { CollectionViewModel } from "../viewmodels/collection.viewmodel.js";

export function toCollectionViewModel(
	collection: Collection,
): CollectionViewModel {
	return {
		id: collection.id,
		name: collection.name,
		description: collection.description,
		imgUrl: collection.imgUrl,
		iso: collection.iso,
	};
}
