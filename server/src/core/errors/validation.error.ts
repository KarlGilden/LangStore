export class ValidationError extends Error {
	constructor(message?: string) {
		super(
			`${message ?? "A validation error occured. Please check your input"}`,
		);
		this.name = "ValidationError";
	}
}
