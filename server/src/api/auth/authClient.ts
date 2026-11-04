export interface AuthClient {
	getUserEmail(userId: string): Promise<string | null>;
}
