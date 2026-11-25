import { useFetch } from "../useFetch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import type { UserSettingsViewModel } from "@langstore/contracts";
import { useSession } from "../../auth/useSession";

export function useUserSettings(enabled = true) {
	const fetch = useFetch();
	const { isSignedIn, userId } = useSession();

	return useQuery<UserSettingsViewModel>({
		enabled: enabled && isSignedIn && userId !== null,
		queryFn: ({ signal }) =>
			fetch<UserSettingsViewModel>({ path: "/user/setting", signal }),
		queryKey: queryKeys.USER_SETTINGS(userId),
		staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
	});
}
