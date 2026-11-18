import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";

export const paths = {
	home: "/",
	signIn: "/sign-in",
	collections: (iso: string) => `/${iso}/collections`,
	upload: (iso: string) => `/${iso}/upload`,
} as const;

export const defaultAppPath = paths.collections(DEFAULT_LANGUAGE_ISO);
