import type { FastifyReply, FastifyRequest } from "fastify";
import { MissingIdentityEmailError } from "../../core/errors/identity-profile.error.js";
import { UserEmailConflictError } from "../../core/errors/user.error.js";
import {
	InvalidLanguageCodeError,
	SettingsNotFoundError,
} from "../../core/errors/user-settings.error.js";
import {
	CollectionNotFoundError,
	InvalidCollectionLanguageCodeError,
	InvalidCollectionTextError,
} from "../../core/errors/collection.error.js";
import {
	InvalidPageLanguageCodeError,
	InvalidPageTextError,
	PageCreateConflictError,
	PageNotFoundError,
} from "../../core/errors/page.error.js";
import {
	EntryNotFoundError,
	InvalidEntryLanguageCodeError,
	InvalidEntryTextError,
} from "../../core/errors/entry.error.js";

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
	} else if (error instanceof SettingsNotFoundError) {
		statusCode = 404;
		code = "SETTINGS_NOT_FOUND";
		message = error.message;
	} else if (error instanceof InvalidLanguageCodeError) {
		statusCode = 400;
		code = "INVALID_LANGUAGE_CODE";
		message = error.message;
	} else if (error instanceof CollectionNotFoundError) {
		statusCode = 404;
		code = "COLLECTION_NOT_FOUND";
		message = error.message;
	} else if (error instanceof InvalidCollectionLanguageCodeError) {
		statusCode = 400;
		code = "INVALID_LANGUAGE_CODE";
		message = error.message;
	} else if (error instanceof InvalidCollectionTextError) {
		statusCode = 400;
		code = "INVALID_COLLECTION_TEXT";
		message = error.message;
	} else if (error instanceof PageNotFoundError) {
		statusCode = 404;
		code = "PAGE_NOT_FOUND";
		message = error.message;
	} else if (error instanceof PageCreateConflictError) {
		statusCode = 409;
		code = "PAGE_CREATE_CONFLICT";
		message = error.message;
	} else if (error instanceof InvalidPageLanguageCodeError) {
		statusCode = 400;
		code = "INVALID_LANGUAGE_CODE";
		message = error.message;
	} else if (error instanceof InvalidPageTextError) {
		statusCode = 400;
		code = "INVALID_PAGE_TEXT";
		message = error.message;
	} else if (error instanceof EntryNotFoundError) {
		statusCode = 404;
		code = "ENTRY_NOT_FOUND";
		message = error.message;
	} else if (error instanceof InvalidEntryLanguageCodeError) {
		statusCode = 400;
		code = "INVALID_LANGUAGE_CODE";
		message = error.message;
	} else if (error instanceof InvalidEntryTextError) {
		statusCode = 400;
		code = "INVALID_ENTRY_TEXT";
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
