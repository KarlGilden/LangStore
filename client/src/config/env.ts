const CLERK_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9_$-]+$/;

function readClerkPublishableKey(): string {
	const value = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

	if (typeof value !== "string" || !CLERK_KEY_PATTERN.test(value)) {
		throw new Error(
			"VITE_CLERK_PUBLISHABLE_KEY must be a valid Clerk publishable key beginning with pk_test_ or pk_live_.",
		);
	}

	if (value === "pk_test_replace_me") {
		throw new Error(
			"Replace VITE_CLERK_PUBLISHABLE_KEY with the publishable key from the existing Clerk application.",
		);
	}

	return value;
}

function readBaseAPIUrl(): string {
	const value = import.meta.env.VITE_API_BASE_URL;

	if (typeof value !== "string") {
		throw new Error("BASE_URL must be a valid url");
	}

	return value;
}

export const env = {
	clerkPublishableKey: readClerkPublishableKey(),
	baseUrl: readBaseAPIUrl(),
} as const;
