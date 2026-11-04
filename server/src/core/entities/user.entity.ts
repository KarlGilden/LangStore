export interface User {
	id: string;
	providerId: string;
	username: string | null;
	email: string;
	createdAt: Date;
}
