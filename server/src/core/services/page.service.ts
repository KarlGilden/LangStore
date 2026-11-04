import { CollectionNotFoundError } from "../errors/collection.error.js";
import {
	InvalidPageLanguageCodeError,
	InvalidPageTextError,
	PageNotFoundError,
} from "../errors/page.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { CollectionRepository } from "../repositories/collection.repository.js";
import type { PageRepository } from "../repositories/page.repository.js";
import type { UserService } from "./user.service.js";

export interface CreatePageInput {
	id: string;
	collectionId: string;
	name: string;
	description?: string | null;
}

function requireLanguageCode(iso: string): void {
	if (!isAssignedIso6391Code(iso)) {
		throw new InvalidPageLanguageCodeError();
	}
}

function requireNonBlank(
	field: "name" | "description",
	value: string,
): void {
	if (!/\S/u.test(value)) {
		throw new InvalidPageTextError(field);
	}
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
		requireLanguageCode(iso);
		requireNonBlank("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requireNonBlank("description", input.description);
		}

		const user = await userService.getOrCreateUser(providerId);
		await requireCollection(user.id, iso, input.collectionId);
		return pageRepository.create({
			id: input.id,
			userId: user.id,
			collectionId: input.collectionId,
			name: input.name,
			description: input.description ?? null,
		});
	};

	const getPage = async (providerId: string, iso: string, pageId: string) => {
		requireLanguageCode(iso);
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
		requireLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		await requireCollection(user.id, iso, collectionId);
		return pageRepository.listByCollectionForUserAndIso(
			collectionId,
			user.id,
			iso,
		);
	};

	const getLatestPage = async (providerId: string, iso: string) => {
		requireLanguageCode(iso);
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
