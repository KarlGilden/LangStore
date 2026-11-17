import { env } from "../config/env";
import { useSession } from "../auth/useSession";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ContentType =
	| "application/json"
	| "multipart/form-data"
	| "application/x-www-form-urlencoded";

export interface FetchConfig {
	path: string;
	method?: HttpMethod;
	contentType?: ContentType;
	baseURL?: string;
	body?: unknown;
	headers?: Record<string, string>;
}

/**
 * Creates a fetch function that can be used as queryFn or mutationFn for React Query
 * @param config - Configuration object with path, method, contentType, and baseURL
 * @returns A function that can be used with useQuery or useMutation
 */
export const useFetch = () => {
	const { getToken } = useSession();

	return async <T = any>({
		path,
		method = "GET",
		contentType = "application/json",
		body,
		headers: additionalHeaders,
	}: FetchConfig): Promise<T> => {
		const includeContentType = !!body && contentType !== "multipart/form-data";

		const fetchPath = buildUrl(path);
		const fetchHeaders: Record<string, string> = { ...additionalHeaders };

		// Add Clerk authentication token
		const token = await getToken();
		if (token) {
			fetchHeaders["Authorization"] = `Bearer ${token}`;
		}

		// Only set Content-Type if body exists and not multipart/form-data
		if (includeContentType) {
			fetchHeaders["Content-Type"] = contentType;
		}

		const fetchOptions: RequestInit = {
			method,
			headers: fetchHeaders,
			credentials: "include",
		};

		// Only include body if it exists
		if (body) {
			if (contentType === "application/json") {
				fetchOptions.body = JSON.stringify(body);
			} else if (contentType === "multipart/form-data") {
				// For FormData, let the browser set Content-Type with boundary
				fetchOptions.body = body as FormData;
			} else {
				fetchOptions.body = body as BodyInit;
			}
		}

		const response = await fetch(fetchPath, fetchOptions);

		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ message: response.statusText }));
			throw new Error(
				errorData.message || `HTTP error! status: ${response.status}`,
			);
		}

		// Handle different response types
		const contentTypeHeader = response.headers.get("content-type");
		if (contentTypeHeader?.includes("application/json")) {
			return (await response.json()) as T;
		}

		return (await response.text()) as T;
	};
};

const buildUrl = (path: string) => {
	return env.baseUrl + path;
};
