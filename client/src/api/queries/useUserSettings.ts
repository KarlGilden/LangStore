import { useFetch } from "../useFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { UserSettingsViewModel } from "@langstore/contracts";

export function useUserSettings() {
	const fetch = useFetch();

	return useQuery<UserSettingsViewModel>({
		queryFn: () => fetch({ method: "GET", path: "/user/setting" }),
		queryKey: queryKeys.USER_SETTINGS,
		staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
	});
}
