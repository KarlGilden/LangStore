import { expect, it } from "vitest";
import { buildApp } from "../../src/api/app.js";

it("serves public process health without external services", async () => {
	const app = await buildApp();
	try {
		const response = await app.inject({ method: "GET", url: "/health" });
		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toContain("application/json");
		expect(response.json()).toEqual({ status: "ok" });
	} finally {
		await app.close();
	}
});
