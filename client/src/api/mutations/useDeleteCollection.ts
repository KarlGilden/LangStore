import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface DeleteCollectionVariables {
	iso: string;
	collectionId: string;
}

export function useDeleteCollection() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteCollectionVariables>({
		mutationFn: ({ iso, collectionId }) =>
			fetch<void>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}`,
				method: "DELETE",
			}),
		onSuccess: async (_, { iso, collectionId }) => {
			queryClient.removeQueries({
				queryKey: [...queryKeys.COLLECTION, iso, collectionId],
			});
			queryClient.removeQueries({
				queryKey: [...queryKeys.COLLECTION_PAGES, iso, collectionId],
			});
			await queryClient.invalidateQueries({
				queryKey: [...queryKeys.COLLECTIONS, iso],
			});
		},
	});
}
