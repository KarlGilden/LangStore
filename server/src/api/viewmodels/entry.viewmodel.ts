export interface TranslationViewModel {
	id: string;
	text: string;
	createdAt: string;
}

export interface EntryViewModel {
	id: string;
	text: string;
	iso: string;
	createdAt: string;
	translations: TranslationViewModel[];
}
