export class UserEmailConflictError extends Error {
	constructor() {
		super("Email belongs to another user identity");
		this.name = "UserEmailConflictError";
	}
}
