export const queryKeys = {
	COLLECTIONS: ["collections"],
	COLLECTION: ["collection"],
	COLLECTION_PAGES: ["collection-pages"],
	PAGE: ["page"],
	PAGE_ENCOUNTERS: ["page-encounters"],
	ENTRIES: ["entries"],
	USER_SETTINGS: (userId: string | null) => ["user-settings", userId],
};

export const QUERY_KEYS = queryKeys;
