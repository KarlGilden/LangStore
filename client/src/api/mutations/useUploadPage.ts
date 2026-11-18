import type { PageIngestionViewModel } from "@langstore/contracts";
import { useMutation } from "@tanstack/react-query";
import { useFetch } from "../useFetch";

interface UploadPageVariables {
	iso: string;
	collectionId: string;
	photo: File;
}

export function useUploadPage() {
	const fetch = useFetch();

	return useMutation<PageIngestionViewModel, Error, UploadPageVariables>({
		mutationFn: ({ iso, collectionId, photo }) => {
			const formData = new FormData();
			formData.append("name", photo.name || "Photographed page");
			formData.append("photo", photo);

			return fetch<PageIngestionViewModel>({
				path: `/${encodeURIComponent(iso)}/collection/${encodeURIComponent(collectionId)}/page-ingestions`,
				method: "POST",
				contentType: "multipart/form-data",
				body: formData,
			});
		},
	});
}
