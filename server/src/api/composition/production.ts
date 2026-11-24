import { createDatabase } from "../../infrastructure/data/db.js";
import type { BuildAppDependencies } from "../app.js";
import type { AppConfig } from "../config.js";
import { createRepositories } from "./repository.js";
import { createExternalServices } from "./externalServices.js";
import { createServices } from "./services.js";

export async function createProductionDependencies(
	config: AppConfig,
): Promise<BuildAppDependencies> {
	const { db, close: closeDatabase } = createDatabase(config.DATABASE_URL);

	let externalServiceCloseFunctions: (() => Promise<void>)[] = [];

	try {
		const repositories = createRepositories(db);
		const externalServices = createExternalServices(config);
		const services = createServices(repositories, externalServices);

		externalServiceCloseFunctions = Object.values(externalServices).map((x) => {
			return x.close;
		});

		return {
			services,
			authConfig: {
				publishableKey: config.CLERK_PUBLISHABLE_KEY,
				secretKey: config.CLERK_SECRET_KEY,
			},
			close: async () => {
				await Promise.all([
					closeDatabase(),
					...externalServiceCloseFunctions.map((close) => close()),
				]);
			},
		};
	} catch (error) {
		await Promise.allSettled([
			closeDatabase(),
			...externalServiceCloseFunctions.map((close) => close()),
		]);
		throw error;
	}
}
