import type {
	EntryReviewViewModel,
	EntryViewModel,
} from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface UpdateEntryTranslationsVariables {
	iso: string;
	entryId: string;
	translations: readonly string[];
}

export function useUpdateEntryTranslations() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<
		EntryViewModel,
		Error,
		UpdateEntryTranslationsVariables
	>({
		mutationFn: ({ iso, entryId, translations }) =>
			fetch<EntryViewModel>({
				path: `/${encodeURIComponent(iso)}/entry/${encodeURIComponent(entryId)}`,
				method: "PATCH",
				body: {
					translations: translations.map((text) => ({ text })),
				},
			}),
		onSuccess: (updatedEntry, { iso }) => {
			queryClient.setQueryData<EntryReviewViewModel[]>(
				[...queryKeys.ENTRIES, iso],
				(entries) =>
					entries?.map((entry) =>
						entry.id === updatedEntry.id
							? { ...entry, ...updatedEntry }
							: entry,
					),
			);
		},
	});
}
