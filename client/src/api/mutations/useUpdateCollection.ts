import type { CollectionViewModel } from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface UpdateCollectionVariables {
	iso: string;
	collectionId: string;
	name: string;
	description: string | null;
	imgUrl: string | null;
}

export function useUpdateCollection() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<CollectionViewModel, Error, UpdateCollectionVariables>({
		mutationFn: ({ iso, collectionId, name, description, imgUrl }) =>
			fetch<CollectionViewModel>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}`,
				method: "PUT",
				body: { name, description, imgUrl },
			}),
		onSuccess: async (collection) => {
			queryClient.setQueryData(
				[...queryKeys.COLLECTION, collection.iso, collection.id],
				collection,
			);
			await queryClient.invalidateQueries({
				queryKey: [...queryKeys.COLLECTIONS, collection.iso],
			});
		},
	});
}
