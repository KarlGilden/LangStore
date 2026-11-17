export const DEFAULT_ISO = "de";

export const paths = {
	home: "/",
	signIn: "/sign-in",
	collections: (iso: string) => `/${iso}/collections`,
} as const;

export const defaultAppPath = paths.collections(DEFAULT_ISO);
