import { CollectionNotFoundError } from "../errors/collection.error.js";
import { PageNotFoundError } from "../errors/page.error.js";
import type { CollectionRepository } from "../repositories/collection.repository.js";
import type { PageRepository } from "../repositories/page.repository.js";
import { requirePageLanguageCode, requirePageText } from "./page.validation.js";

export type PageServiceDependencies = {
	pageRepository: PageRepository;
	collectionRepository: CollectionRepository;
};

export interface CreatePageInput {
	collectionId: string;
	name: string;
	description?: string | null;
	summary: string | null;
}

export interface UpdatePageInput {
	name: string;
	description?: string | null;
}

export const createPageService = ({
	pageRepository,
	collectionRepository,
}: PageServiceDependencies) => {
	const requireCollection = async (
		userId: string,
		iso: string,
		collectionId: string,
	) => {
		const collection = await collectionRepository.getById(
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
		userId: string,
		iso: string,
		input: CreatePageInput,
	) => {
		requirePageLanguageCode(iso);
		requirePageText("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requirePageText("description", input.description);
		}

		await requireCollection(userId, iso, input.collectionId);
		return pageRepository.create({
			userId: userId,
			collectionId: input.collectionId,
			name: input.name,
			description: input.description ?? null,
			summary: input.summary,
		});
	};

	const getPage = async (userId: string, iso: string, pageId: string) => {
		requirePageLanguageCode(iso);
		const page = await pageRepository.getById(pageId, userId, iso);
		if (!page) {
			throw new PageNotFoundError();
		}
		return page;
	};

	const getAllCollectionPages = async (
		userId: string,
		iso: string,
		collectionId: string,
	) => {
		requirePageLanguageCode(iso);
		await requireCollection(userId, iso, collectionId);
		return pageRepository.getByCollection(collectionId, userId, iso);
	};

	const updatePage = async (
		userId: string,
		iso: string,
		pageId: string,
		input: UpdatePageInput,
	) => {
		requirePageLanguageCode(iso);
		requirePageText("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requirePageText("description", input.description);
		}

		const page = await pageRepository.update(pageId, userId, iso, {
			name: input.name,
			description: input.description ?? null,
		});
		if (!page) {
			throw new PageNotFoundError();
		}
		return page;
	};

	const deletePage = async (userId: string, iso: string, pageId: string) => {
		requirePageLanguageCode(iso);
		const deleted = await pageRepository.delete(pageId, userId, iso);
		if (!deleted) {
			throw new PageNotFoundError();
		}
	};

	const getLatestPage = async (userId: string, iso: string) => {
		requirePageLanguageCode(iso);
		const page = await pageRepository.getLatest(userId, iso);
		if (!page) {
			throw new PageNotFoundError();
		}
		return page;
	};

	return {
		createPage,
		getPage,
		updatePage,
		deletePage,
		getAllCollectionPages,
		getLatestPage,
	};
};

export type PageService = ReturnType<typeof createPageService>;
