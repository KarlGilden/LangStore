import { useFetch } from "../useFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

interface UserSettingsViewModel {
	targetLanguage: string;
	userLanguage: string;
}

export function useUserSettings() {
	const fetch = useFetch();

	return useQuery<UserSettingsViewModel>({
		queryFn: () => fetch({ method: "GET", path: "/user/setting" }),
		queryKey: queryKeys.USER_SETTINGS,
		staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
	});
}
