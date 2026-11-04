import type { FastifyReply, FastifyRequest } from "fastify";
import { MissingIdentityEmailError } from "../../core/errors/identity-profile.error.js";
import { UserEmailConflictError } from "../../core/errors/user.error.js";

type HttpError = Error & {
	code?: string;
	statusCode?: number;
};

export const errorHandler = (
	error: HttpError,
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	let statusCode = 500;
	let code = "INTERNAL_SERVER_ERROR";
	let message = "An unexpected error occurred";

	if (error instanceof MissingIdentityEmailError) {
		statusCode = 409;
		code = "IDENTITY_EMAIL_MISSING";
		message = error.message;
	} else if (error instanceof UserEmailConflictError) {
		statusCode = 409;
		code = "USER_EMAIL_CONFLICT";
		message = error.message;
	} else if (
		typeof error.statusCode === "number" &&
		error.statusCode >= 400 &&
		error.statusCode < 500
	) {
		statusCode = error.statusCode;
		code = error.code ?? "REQUEST_ERROR";
		message = error.message;
	}

	const logDetails = {
		request: {
			id: request.id,
			method: request.method,
			url: request.url,
		},
		error,
	};

	if (statusCode >= 500) {
		reply.log.error(logDetails, error.message || message);
	} else {
		reply.log.warn(logDetails, error.message || message);
	}

	return reply.code(statusCode).send({
		error: { code, message },
		requestId: request.id,
	});
};
