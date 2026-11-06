import { CollectionNotFoundError } from "../errors/collection.error.js";
import {
	PageNotFoundError,
} from "../errors/page.error.js";
import type { CollectionRepository } from "../repositories/collection.repository.js";
import type { PageRepository } from "../repositories/page.repository.js";
import type { UserService } from "./user.service.js";
import { requirePageLanguageCode, requirePageText } from "./page.validation.js";

export interface CreatePageInput {
	id: string;
	collectionId: string;
	name: string;
	description?: string | null;
}

export const createPageService = (
	pageRepository: PageRepository,
	collectionRepository: CollectionRepository,
	userService: UserService,
) => {
	const requireCollection = async (
		userId: string,
		iso: string,
		collectionId: string,
	) => {
		const collection = await collectionRepository.findByIdForUserAndIso(
			collectionId,
			userId,
			iso,
		);
		if (!collection) {
			throw new CollectionNotFoundError();
		}
		return collection;
	};

	const createPage = async (
		providerId: string,
		iso: string,
		input: CreatePageInput,
	) => {
		requirePageLanguageCode(iso);
		requirePageText("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requirePageText("description", input.description);
		}

		const user = await userService.getOrCreateUser(providerId);
		await requireCollection(user.id, iso, input.collectionId);
		return pageRepository.create({
			id: input.id,
			userId: user.id,
			collectionId: input.collectionId,
			name: input.name,
			description: input.description ?? null,
			summary: null,
		});
	};

	const getPage = async (providerId: string, iso: string, pageId: string) => {
		requirePageLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		const page = await pageRepository.findByIdForUserAndIso(
			pageId,
			user.id,
			iso,
		);
		if (!page) {
			throw new PageNotFoundError();
		}
		return page;
	};

	const listCollectionPages = async (
		providerId: string,
		iso: string,
		collectionId: string,
	) => {
		requirePageLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		await requireCollection(user.id, iso, collectionId);
		return pageRepository.listByCollectionForUserAndIso(
			collectionId,
			user.id,
			iso,
		);
	};

	const getLatestPage = async (providerId: string, iso: string) => {
		requirePageLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		const page = await pageRepository.findLatestByUserAndIso(user.id, iso);
		if (!page) {
			throw new PageNotFoundError();
		}
		return page;
	};

	return { createPage, getPage, listCollectionPages, getLatestPage };
};

export type PageService = ReturnType<typeof createPageService>;
