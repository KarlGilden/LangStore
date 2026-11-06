import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { MissingIdentityEmailError } from "../../src/core/errors/identity-profile.error.js";
import { UserEmailConflictError } from "../../src/core/errors/user.error.js";
import { ServiceUnavailableError } from "../../src/core/errors/service.error.js";
import { ValidationError } from "../../src/core/errors/validation.error.js";

describe("errorHandler", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	it("returns a conflict when an authenticated identity has no email", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/user", async () => {
			throw new MissingIdentityEmailError();
		});

		const response = await app.inject({ method: "GET", url: "/user" });

		expect(response.statusCode).toBe(409);
		expect(response.json()).toMatchObject({
			error: {
				code: "IDENTITY_EMAIL_MISSING",
				message: "Authenticated user has no email address",
			},
		});
	});

	it("preserves intentional client error statuses", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/invalid", async () => {
			const error = new Error("Invalid request") as Error & {
				code: string;
				statusCode: number;
			};
			error.code = "INVALID_REQUEST";
			error.statusCode = 422;
			throw error;
		});

		const response = await app.inject({ method: "GET", url: "/invalid" });

		expect(response.statusCode).toBe(422);
		expect(response.json().error).toEqual({
			code: "INVALID_REQUEST",
			message: "Invalid request",
		});
	});

	it("returns a conflict when an email belongs to another identity", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/user", async () => {
			throw new UserEmailConflictError();
		});

		const response = await app.inject({ method: "GET", url: "/user" });

		expect(response.statusCode).toBe(409);
		expect(response.json().error).toEqual({
			code: "USER_EMAIL_CONFLICT",
			message: "Email belongs to another user identity",
		});
	});

	it("does not expose unexpected error details", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/failure", async () => {
			throw new Error("Database credentials leaked");
		});

		const response = await app.inject({ method: "GET", url: "/failure" });

		expect(response.statusCode).toBe(500);
		expect(response.json()).toMatchObject({
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "An unexpected error occurred",
			},
		});
		expect(response.body).not.toContain("Database credentials leaked");
	});

	it("maps the new validation contract to an actionable client error", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/invalid-page", async () => {
			throw new ValidationError("No readable text was found in the image.");
		});

		const response = await app.inject({ method: "GET", url: "/invalid-page" });

		expect(response.statusCode).toBe(422);
		expect(response.json().error).toEqual({
			code: "VALIDATION_ERROR",
			message: "No readable text was found in the image.",
		});
	});

	it("maps the new service contract without exposing its cause", async () => {
		const app = Fastify();
		apps.push(app);
		app.setErrorHandler(errorHandler);
		app.get("/provider-failure", async () => {
			throw new ServiceUnavailableError(
				"The text recognition service could not process the image.",
				new Error("secret provider payload"),
			);
		});

		const response = await app.inject({ method: "GET", url: "/provider-failure" });

		expect(response.statusCode).toBe(502);
		expect(response.json().error).toEqual({
			code: "SERVICE_UNAVAILABLE",
			message: "The text recognition service could not process the image.",
		});
		expect(response.body).not.toContain("secret provider payload");
	});
});
