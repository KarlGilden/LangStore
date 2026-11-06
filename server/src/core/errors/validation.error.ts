export class ValidationError extends Error {
	constructor(message?: string) {
		super(
			`${message ?? "A validation error occurred. Please check your input"}`,
		);
		this.name = "ValidationError";
	}
}
