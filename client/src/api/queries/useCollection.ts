import type { CollectionViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function useCollection(iso: string, collectionId: string) {
	const fetch = useFetch();

	return useQuery<CollectionViewModel>({
		queryKey: [...queryKeys.COLLECTION, iso, collectionId],
		queryFn: ({ signal }) =>
			fetch<CollectionViewModel>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}`,
				signal,
			}),
		enabled: iso.length > 0 && collectionId.length > 0,
	});
}
