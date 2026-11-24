import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";

export const paths = {
	home: "/",
	signIn: "/sign-in",
	collections: (iso: string) => `/${iso}/collections`,
	newCollection: (iso: string) =>
		`/${encodeURIComponent(iso)}/collections/new`,
	collection: (iso: string, collectionId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}`,
	page: (iso: string, collectionId: string, pageId: string) =>
		`/${encodeURIComponent(iso)}/collections/${encodeURIComponent(collectionId)}/pages/${encodeURIComponent(pageId)}`,
	upload: (iso: string) => `/${iso}/upload`,
} as const;

export const defaultAppPath = paths.collections(DEFAULT_LANGUAGE_ISO);
