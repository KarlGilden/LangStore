export class ServiceUnavailableError extends Error {
	constructor(message?: string, cause?: unknown) {
		super(message ?? "The service is currently unavailable.", { cause });
		this.name = "ServiceUnavailableError";
	}
}
