import type { PageViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function useCollectionPages(iso: string, collectionId: string) {
	const fetch = useFetch();

	return useQuery<PageViewModel[]>({
		queryKey: [...queryKeys.COLLECTION_PAGES, iso, collectionId],
		queryFn: ({ signal }) =>
			fetch<PageViewModel[]>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}/page`,
				signal,
			}),
		enabled: iso.length > 0 && collectionId.length > 0,
	});
}
