import type { EntryReviewViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function useEntries(iso: string) {
	const fetch = useFetch();

	return useQuery<EntryReviewViewModel[]>({
		queryKey: [...queryKeys.ENTRIES, iso],
		queryFn: ({ signal }) =>
			fetch<EntryReviewViewModel[]>({
				path: `/${encodeURIComponent(iso)}/entry`,
				signal,
			}),
		enabled: iso.length > 0,
	});
}
