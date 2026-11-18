import type { PageVocabularyEntryViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function usePageEncounters(
	iso: string,
	pageId: string,
	enabled = true,
) {
	const fetch = useFetch();

	return useQuery<PageVocabularyEntryViewModel[]>({
		queryKey: [...queryKeys.PAGE_ENCOUNTERS, iso, pageId],
		queryFn: ({ signal }) =>
			fetch<PageVocabularyEntryViewModel[]>({
				path: `/${encodeURIComponent(iso)}/page/${encodeURIComponent(pageId)}/vocabulary`,
				signal,
			}),
		enabled: enabled && iso.length > 0 && pageId.length > 0,
	});
}
