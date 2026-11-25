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
	signal?: AbortSignal;
}

/**
 * Creates a fetch function that can be used as queryFn or mutationFn for React Query
 * @param config - Configuration object with path, method, contentType, and baseURL
 * @returns A function that can be used with useQuery or useMutation
 */
export const useFetch = () => {
	const { getToken } = useSession();

	return async <T = unknown>({
		path,
		method = "GET",
		contentType = "application/json",
		body,
		headers: additionalHeaders,
		signal,
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
			signal,
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
			const errorData: unknown = await response.json().catch(() => null);
			throw Object.assign(new Error(readErrorMessage(errorData, response)), {
				status: response.status,
			});
		}

		// Handle different response types
		const contentTypeHeader = response.headers.get("content-type");
		if (contentTypeHeader?.includes("application/json")) {
			return (await response.json()) as T;
		}

		return (await response.text()) as T;
	};
};

function readErrorMessage(errorData: unknown, response: Response): string {
	if (typeof errorData === "object" && errorData !== null) {
		if (
			"message" in errorData &&
			typeof errorData.message === "string" &&
			errorData.message
		) {
			return errorData.message;
		}

		if (
			"error" in errorData &&
			typeof errorData.error === "string" &&
			errorData.error
		) {
			return errorData.error;
		}

		if (
			"error" in errorData &&
			typeof errorData.error === "object" &&
			errorData.error !== null &&
			"message" in errorData.error &&
			typeof errorData.error.message === "string" &&
			errorData.error.message
		) {
			return errorData.error.message;
		}
	}

	return response.statusText || `Request failed with status ${response.status}`;
}

const buildUrl = (path: string) => {
	return env.baseUrl + path;
};
