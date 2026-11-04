import { buildApp } from "./app.js";

const app = await buildApp({
	logger: { redact: ["req.headers.authorization", "req.headers.cookie"] },
});

async function shutdown(): Promise<void> {
	try {
		await app.close();
	} catch (error) {
		app.log.error(error, "Failed to close the server");
		process.exitCode = 1;
	}
}

try {
	const port = Number(process.env.PORT ?? "3000");
	const host = process.env.HOST ?? "0.0.0.0";

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error("PORT must be an integer between 1 and 65535");
	}

	if (host.trim().length === 0) {
		throw new Error("HOST must not be empty");
	}

	process.once("SIGINT", shutdown);
	process.once("SIGTERM", shutdown);

	await app.listen({ port, host });
} catch (error) {
	app.log.error(error, "Server startup failed");

	process.exitCode = 1;
	await shutdown();
}
