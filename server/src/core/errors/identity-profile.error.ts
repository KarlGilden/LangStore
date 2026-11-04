export class MissingIdentityEmailError extends Error {
	constructor() {
		super("Authenticated user has no email address");
		this.name = "MissingIdentityEmailError";
	}
}
