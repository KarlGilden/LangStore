export interface Page {
	id: string;
	userId: string;
	collectionId: string;
	name: string;
	description: string | null;
	summary: string | null;
	createdAt: Date;
}
