import type { PageViewModel } from "@langstore/contracts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function usePage(iso: string, pageId: string) {
	const fetch = useFetch();

	return useQuery<PageViewModel>({
		queryKey: [...queryKeys.PAGE, iso, pageId],
		queryFn: ({ signal }) =>
			fetch<PageViewModel>({
				path: `/${encodeURIComponent(iso)}/page/${encodeURIComponent(pageId)}`,
				signal,
			}),
		enabled: iso.length > 0 && pageId.length > 0,
	});
}
