export interface IdentityProfile {
	username: string | null;
	email: string;
}

export interface IdentityProfileProvider {
	getUserProfile(userId: string): Promise<IdentityProfile | null>;
}
