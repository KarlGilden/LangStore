import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";

export const paths = {
	home: "/",
	signIn: "/sign-in",
	collections: (iso: string) => `/${iso}/collections`,
	newCollection: (iso: string) =>
		`/${encodeURIComponent(iso)}/collections/new`,
	collection: (iso: string, collectionId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}`,
	editCollection: (iso: string, collectionId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}/edit`,
	newPage: (iso: string, collectionId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}/pages/new`,
	page: (iso: string, collectionId: string, pageId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}/pages/${encodeURIComponent(pageId)}`,
	upload: (iso: string) => `/${iso}/upload`,
	review: (iso: string) => `/${encodeURIComponent(iso)}/review`,
} as const;

export const defaultAppPath = paths.collections(DEFAULT_LANGUAGE_ISO);
