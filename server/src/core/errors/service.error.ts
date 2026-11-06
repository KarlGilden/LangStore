export class ServiceUnavailableError extends Error {
	constructor(message?: string, cause?: string) {
		super(
			`${message ?? "The service is currently unavailable."} ${cause ? `Cause: ${cause}` : ""}`,
		);
		this.name = "ServiceUnavailableError";
	}
}
