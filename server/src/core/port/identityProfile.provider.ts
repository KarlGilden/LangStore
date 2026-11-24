export interface IdentityProfile {
	username: string | null;
	email: string;
}

export interface IdentityProfileService {
	getUserProfile(userId: string): Promise<IdentityProfile | null>;
}
