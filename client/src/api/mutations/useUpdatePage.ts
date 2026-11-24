import type { PageViewModel } from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface UpdatePageVariables {
	iso: string;
	pageId: string;
	name: string;
	description: string | null;
}

export function useUpdatePage() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<PageViewModel, Error, UpdatePageVariables>({
		mutationFn: ({ iso, pageId, name, description }) =>
			fetch<PageViewModel>({
				path: `/${encodeURIComponent(iso)}/page/${encodeURIComponent(pageId)}`,
				method: "PUT",
				body: { name, description },
			}),
		onSuccess: async (page, { iso }) => {
			queryClient.setQueryData(
				[...queryKeys.PAGE, iso, page.id],
				page,
			);
			await queryClient.invalidateQueries({
				queryKey: [...queryKeys.COLLECTION_PAGES, iso, page.collectionId],
			});
		},
	});
}
