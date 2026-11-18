import type { CollectionViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function useCollections(iso: string) {
	const fetch = useFetch();

	return useQuery<CollectionViewModel[]>({
		queryKey: [...queryKeys.COLLECTIONS, iso],
		queryFn: () =>
			fetch<CollectionViewModel[]>({
				path: `/${encodeURIComponent(iso)}/collection`,
			}),
		enabled: iso.length > 0,
	});
}
