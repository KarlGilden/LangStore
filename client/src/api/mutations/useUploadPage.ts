import type { PageIngestionViewModel } from "@langstore/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

interface UploadPageVariables {
	iso: string;
	collectionId: string;
	title: string;
	description: string | null;
	photo: File;
}

export function useUploadPage() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<PageIngestionViewModel, Error, UploadPageVariables>({
		mutationFn: ({ iso, collectionId, title, description, photo }) => {
			const formData = new FormData();
			formData.append("name", title);
			if (description) formData.append("description", description);
			formData.append("photo", photo);

			return fetch<PageIngestionViewModel>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}/page-ingestions`,
				method: "POST",
				contentType: "multipart/form-data",
				body: formData,
			});
		},
		onSuccess: async (_result, { iso, collectionId }) => {
			await queryClient.invalidateQueries({
				queryKey: [...queryKeys.COLLECTION_PAGES, iso, collectionId],
			});
		},
	});
}
