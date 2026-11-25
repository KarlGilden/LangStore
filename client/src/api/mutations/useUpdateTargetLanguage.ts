import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	SupportedLanguageIso,
	UserSettingsViewModel,
} from "@langstore/contracts";
import { useSession } from "../../auth/useSession";
import { queryKeys } from "../queryKeys";
import { useFetch } from "../useFetch";

export function useUpdateTargetLanguage() {
	const fetch = useFetch();
	const { userId } = useSession();
	const queryClient = useQueryClient();
	const queryKey = queryKeys.USER_SETTINGS(userId);

	return useMutation({
		mutationFn: async ({
			targetLanguage,
			nativeLanguage,
		}: {
			targetLanguage: SupportedLanguageIso;
			nativeLanguage?: SupportedLanguageIso;
		}) => {
			const settings = await fetch<UserSettingsViewModel | null>({
				path: "/user/setting",
			}).catch((error: unknown) => {
				if (error instanceof Error && "status" in error &&
					error.status === 404 && nativeLanguage) {
					return null;
				}
				throw error;
			});

			return fetch<UserSettingsViewModel>({
				method: "PUT",
				path: "/user/setting",
				body: { targetLanguage, userLanguage: settings?.userLanguage ?? nativeLanguage },
			});
		},
		onSuccess: async (settings) => {
			await queryClient.cancelQueries({ queryKey });
			queryClient.setQueryData(queryKey, settings);
		},
	});
}
