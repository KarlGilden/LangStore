export interface IdentityProfile {
	username: string | null;
	email: string;
}

export interface IdentityProfileReader {
	getUserProfile(userId: string): Promise<IdentityProfile | null>;
}
