import type { Page } from "../../core/entities/page.entity.js";
import type { PageViewModel } from "../viewmodels/page.viewmodel.js";

export function toPageViewModel(page: Page): PageViewModel {
	return {
		id: page.id,
		collectionId: page.collectionId,
		name: page.name,
		description: page.description,
		summary: page.summary,
		createdAt: page.createdAt.toISOString(),
	};
}
