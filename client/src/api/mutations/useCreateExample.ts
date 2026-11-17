import { useFetch } from "../useFetch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

interface CreateExampleVariables {
	name: string;
	description?: string;
}

interface CreateExampleResponse {
	id: number;
	name: string;
	description: string;
}

/**
 * Create example mutation
 */
export function useCreateExample() {
	const fetch = useFetch();
	const queryClient = useQueryClient();

	return useMutation<CreateExampleResponse, Error, CreateExampleVariables>({
		mutationFn: (data) =>
			fetch({
				method: "POST",
				path: "/examples",
				body: data,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.COLLECTIONS });
		},
	});
}
