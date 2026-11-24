import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface DeletePageVariables {
	iso: string;
	collectionId: string;
	pageId: string;
}

export function useDeletePage() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeletePageVariables>({
		mutationFn: ({ iso, pageId }) =>
			fetch<void>({
				path: `/${encodeURIComponent(iso)}/page/${encodeURIComponent(pageId)}`,
				method: "DELETE",
			}),
		onSuccess: async (_, { iso, collectionId, pageId }) => {
			queryClient.removeQueries({
				queryKey: [...queryKeys.PAGE, iso, pageId],
			});
			queryClient.removeQueries({
				queryKey: [...queryKeys.PAGE_ENCOUNTERS, iso, pageId],
			});
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: [...queryKeys.COLLECTION_PAGES, iso, collectionId],
				}),
				queryClient.invalidateQueries({
					queryKey: [...queryKeys.ENTRIES, iso],
				}),
			]);
		},
	});
}
