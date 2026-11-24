import type { CollectionViewModel } from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface CreateCollectionVariables {
	iso: string;
	name: string;
	description: string | null;
}

export function useCreateCollection() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<CollectionViewModel, Error, CreateCollectionVariables>({
		mutationFn: ({ iso, name, description }) =>
			fetch<CollectionViewModel>({
				path: `/${encodeURIComponent(iso)}/collection`,
				method: "POST",
				body: { name, description },
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
