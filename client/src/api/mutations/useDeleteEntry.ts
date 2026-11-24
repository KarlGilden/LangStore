import type { EntryReviewViewModel } from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface DeleteEntryVariables {
	iso: string;
	entryId: string;
}

export function useDeleteEntry() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<void, Error, DeleteEntryVariables>({
		mutationFn: ({ iso, entryId }) =>
			fetch<void>({
				path: `/${encodeURIComponent(iso)}/entry/${encodeURIComponent(entryId)}`,
				method: "DELETE",
			}),
		onSuccess: async (_, { iso, entryId }) => {
			queryClient.setQueryData<EntryReviewViewModel[]>(
				[...queryKeys.ENTRIES, iso],
				(entries) => entries?.filter((entry) => entry.id !== entryId),
			);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.PAGE_ENCOUNTERS,
			});
		},
	});
}
