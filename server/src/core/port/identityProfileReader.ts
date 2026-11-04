export interface IdentityProfileReader {
	getUserEmail(userId: string): Promise<string | null>;
}
