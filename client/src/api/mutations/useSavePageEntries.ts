import type {
	EntryViewModel,
	PageSuggestionViewModel,
} from "@langstore/contracts";
import { useMutation } from "@tanstack/react-query";
import { useFetch } from "../useFetch";

interface SavePageEntriesVariables {
	iso: string;
	pageId: string;
	suggestions: readonly PageSuggestionViewModel[];
}

export function useSavePageEntries() {
	const fetch = useFetch();

	return useMutation<EntryViewModel[], Error, SavePageEntriesVariables>({
		mutationFn: ({ iso, pageId, suggestions }) =>
			fetch<EntryViewModel[]>({
				path: `/${encodeURIComponent(iso)}/page/${encodeURIComponent(pageId)}/entries`,
				method: "POST",
				body: {
					entries: suggestions.map((suggestion) => {
						const translation = suggestion.translation.trim();
						return {
							text: suggestion.text,
							count: suggestion.count,
							translations: translation ? [{ text: translation }] : [],
						};
					}),
				},
			}),
	});
}
